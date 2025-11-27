import BottomNav from "@/components/telegram/BottomNav";

export default function TelegramLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
