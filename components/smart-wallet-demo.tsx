import { ConnectedWallet as PrivyWallet } from "@privy-io/react-auth";
import { useSmartEmbeddedWallet } from "../hooks/use-smart-embedded-wallet";
import { useCallback, useState } from "react";
import type { Address, Hex } from "viem";
import { useIdentityToken } from "@privy-io/react-auth";

export const SmartWalletDemo = ({
  embeddedWallet,
}: {
  embeddedWallet: PrivyWallet;
}) => {
  const { client } = useSmartEmbeddedWallet({ embeddedWallet });
  const { identityToken } = useIdentityToken();
  const [status, setStatus] = useState<
    | { status: "idle" | "error" | "sending" }
    | { status: "success"; txHash: Hex }
  >({ status: "idle" });

  const [recipientAddress, setRecipientAddress] = useState("");
  const [value, setValue] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );

  const delegateAndSend = useCallback(async () => {
    if (!client) {
      return;
    }

    if (!recipientAddress) {
      setStatus({ status: "error" });
      return;
    }

    setStatus({ status: "sending" });
    try {
      const callData = {
        to: recipientAddress as Address,
        data: "0x",
        ...(value && {
          value: `0x${BigInt(Math.floor(parseFloat(value) * 1e18)).toString(16)}`,
        }),
      };

      const {
        preparedCallIds: [callId],
      } = await client.sendCalls({
        capabilities: {
          eip7702Auth: true,
        },
        from: embeddedWallet.address as Address,
        calls: [callData],
      });
      if (!callId) {
        throw new Error("Missing call id");
      }

      const { receipts } = await client.waitForCallsStatus({ id: callId });
      if (!receipts?.length) {
        throw new Error("Missing transaction receipts");
      }
      const [receipt] = receipts;
      if (receipt?.status !== "success") {
        throw new Error("Transaction failed");
      }
      setStatus({ status: "success", txHash: receipt.transactionHash });
    } catch (err) {
      console.error("Transaction failed:", err);
      setStatus({ status: "error" });
    }
  }, [client, embeddedWallet, recipientAddress, value]);

  const _getAccessToken = useCallback(async () => {
    setTokenStatus("loading");
    try {
      setAccessToken(identityToken);
      setTokenStatus("idle");
    } catch (err) {
      console.error("Failed to get access token:", err);
      setTokenStatus("error");
      setAccessToken(null);
    }
  }, [embeddedWallet]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Embedded EOA Address
        </h2>
        <p className="text-gray-600 font-mono break-all">
          {embeddedWallet.address}
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-green-900">Access Token</h3>
          <button
            onClick={_getAccessToken}
            disabled={tokenStatus === "loading"}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tokenStatus === "loading"
                ? "bg-green-300 text-green-700 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {tokenStatus === "loading" ? "Getting..." : "Get Token"}
          </button>
        </div>
        <div className="text-green-800">
          {tokenStatus === "loading" && (
            <p className="font-mono text-sm">Getting access token...</p>
          )}
          {tokenStatus === "error" && (
            <p className="text-red-600">Failed to get access token</p>
          )}
          {tokenStatus === "idle" && accessToken && (
            <div>
              <p className="text-xs font-mono break-all bg-white p-2 rounded border border-green-300">
                {accessToken}
              </p>
            </div>
          )}
          {tokenStatus === "idle" && !accessToken && (
            <p className="text-gray-600 text-sm">
              Click "Get Token" to retrieve access token
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="recipient"
          className="text-sm font-medium text-gray-700"
        >
          Recipient Address
        </label>
        <input
          id="recipient"
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="value" className="text-sm font-medium text-gray-700">
          Value (ETH) - Optional
        </label>
        <input
          id="value"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={delegateAndSend}
        disabled={!client || status.status === "sending"}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
          status.status === "sending"
            ? "bg-indigo-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {status.status === "sending"
          ? "Sending..."
          : "Upgrade & Send Sponsored Transaction"}
      </button>
      {status.status === "success" && (
        <section className="bg-green-50 rounded-xl shadow-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            Congrats! Sponsored transaction successful!
          </h2>
          <p className="text-green-700 mb-4">
            You've successfully upgraded your EOA to a smart account and sent
            your first sponsored transaction.{" "}
            <a
              href="https://www.alchemy.com/docs/wallets/react/using-7702"
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Keep building
            </a>
            .
          </p>
          <p className="text-green-700">
            <strong>Transaction Hash:</strong>{" "}
            <span className="font-mono break-all">{status.txHash}</span>
          </p>
        </section>
      )}
      {status.status === "error" && (
        <section className="bg-red-50 rounded-xl shadow-lg p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-900 mb-4">
            Transaction Failed
          </h2>
          <p className="text-red-700">
            There was an error sending your sponsored transaction. Please try
            again.
          </p>
        </section>
      )}
    </div>
  );
};
