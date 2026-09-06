import WalletTabs from "@/components/wallet/WalletTabs";

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wallet-scene min-h-[80vh]">
      <div className="mx-auto max-w-[900px] px-5 py-14 sm:px-8">
        <div className="mb-8 flex justify-center">
          <p className="cred-label">LAWFIC Wallet</p>
        </div>
        <WalletTabs />
        <div className="mt-14">{children}</div>
      </div>
    </div>
  );
}
