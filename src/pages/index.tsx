import { useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { Button, Divider, message, Input } from "antd";
import useUniPass from "@/unipass/useUniPass";
import { etherToWei, weiToEther } from "@/unipass/format_bignumber";
import logo from "../assets/UniPass.svg";
import { verifySiweMessage } from "@/unipass/verify_message";

const { TextArea } = Input;

export default function HomePage() {
  const { provider, account, chainId, connect, connectEagerly, disconnect } =
    useUniPass();

  const [balance, setBalance] = useState("0");
  const [signature, setSignature] = useState("");
  const [typedSignature, setTypedSignature] = useState("");
  const [siweMessage, setSiweMessage] = useState("");
  const [siweSignature, setSiweSignature] = useState("");
  const [nativeHash, setNativeHash] = useState("");
  const [sendNativeLoading, setSendNativeLoading] = useState(false);

  useEffect(() => {
    connectEagerly();
  }, []);

  useEffect(() => {
    if (account) {
      getBalance(account);
    }
  }, [account]);

  const getBalance = async (account: string) => {
    const balance = await provider?.getBalance(account);
    console.log(`balance: ${weiToEther(balance ?? 0)}`);

    setBalance(weiToEther(balance ?? 0));
  };

  const _disconnect = async () => {
    await disconnect();
    setBalance("0");
    setSignature("");
    setTypedSignature("");
    setNativeHash("");
    setSendNativeLoading(false);
  };

  const signMessage = async () => {
    if (provider) {
      const signer = provider.getSigner(account);
      const signature = await signer.signMessage("web3-react test message");
      console.log(signature);
      setSignature(signature);
    }
  };

  const signTypedData = async () => {
    if (provider) {
      const eip712DemoData = {
        types: {
          Person: [
            {
              name: "name",
              type: "string",
            },
            {
              name: "wallet",
              type: "address",
            },
          ],
          Mail: [
            {
              name: "from",
              type: "Person",
            },
            {
              name: "to",
              type: "Person",
            },
            {
              name: "contents",
              type: "string",
            },
          ],
        },
        primaryType: "Mail",
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
        },
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
          },
          contents: "Hello, Bob!",
        },
      };
      const signer = provider.getSigner(account);
      const signature = await signer._signTypedData(
        eip712DemoData.domain,
        eip712DemoData.types,
        eip712DemoData.message
      );
      setTypedSignature(signature);
    }
  };

  const sendTransaction = async () => {
    if (provider) {
      setSendNativeLoading(true);
      const signer = provider.getSigner(account);
      const txParams = {
        from: account,
        to: "0x2B6c74b4e8631854051B1A821029005476C3AF06",
        value: etherToWei("0.001"),
        data: "0x",
      };
      try {
        const txResp = await signer.sendTransaction(txParams);
        const res = await txResp.wait();
        console.log(res);
        setNativeHash(res.transactionHash);
      } catch (e: any) {
        message.error(
          `send transaction error: ${e?.message || "unknown error"}`
        );
      } finally {
        setSendNativeLoading(false);
      }
    }
  };

  const signWithEthereum = async () => {
    if (provider && account) {
      const signer = provider.getSigner(account);
      const siweMessage = createSiweMessage(
        account,
        "This is a test statement."
      );
      const _signature = await signer.signMessage(siweMessage);
      setSiweMessage(siweMessage);
      setSiweSignature(_signature);
    }
  };

  const createSiweMessage = (address: string, statement: string) => {
    const { host, origin } = window.location;
    const siweMessage = new SiweMessage({
      domain: host,
      address,
      statement,
      uri: origin,
      version: "1",
      chainId,
    });
    return siweMessage.prepareMessage();
  };

  const getConnectionButtons = () => {
    if (account) {
      return (
        <Button onClick={_disconnect} type="dashed">
          Disconnect
        </Button>
      );
    }
    return (
      <Button onClick={connect} type="primary">
        Connect
      </Button>
    );
  };

  return (
    <div style={{ marginBottom: "50px", width: "450px" }}>
      <img src={logo} alt="" width={150} />
      <h1>Web3-React + UniPass</h1>
      <h3>Connect with UniPass:</h3>
      {getConnectionButtons()}
      <Divider />
      <h3>Wallet States:</h3>
      <>
        <h4>address: {account}</h4>
        <h4>Balance: {balance}</h4>
        <h4>ChainId: {chainId || "-"}</h4>
      </>
      <Divider />
      <h3>Sign Message:</h3>
      <Button
        type="primary"
        disabled={!account}
        onClick={signMessage}
        style={{ marginRight: "30px" }}
      >
        Sign Message
      </Button>
      <h4>signature:</h4>
      <TextArea rows={4} value={signature} />

      <Divider />
      <h3>Sign With Ethereum:</h3>
      <Button
        type="primary"
        disabled={!account}
        onClick={signWithEthereum}
        style={{ marginRight: "30px" }}
      >
        Sign With Ethereum
      </Button>
      <h4>siwe signature:</h4>
      <TextArea rows={4} value={siweSignature} />
      <Button
        type="primary"
        disabled={!siweSignature}
        onClick={() => verifySiweMessage(siweMessage, siweSignature, provider!)}
        style={{ marginRight: "30px", marginTop: "20px" }}
      >
        Verify Signature
      </Button>

      <Divider />
      <Button type="primary" onClick={signTypedData} disabled={!account}>
        Sign Typed Data(EIP-712)
      </Button>
      <h4>Typed Data Signature:</h4>
      <TextArea rows={4} value={typedSignature} />
      <Divider />
      <h3>Send Transaction:</h3>
      <Button
        onClick={sendTransaction}
        type="primary"
        disabled={!account}
        loading={sendNativeLoading}
      >
        Send native Token
      </Button>
      <h4>native tx hash:</h4>
      <TextArea rows={1} value={nativeHash} />
      <Divider />
    </div>
  );
}
