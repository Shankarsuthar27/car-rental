export default function RootLoading() {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 w-full bg-primary/10 overflow-hidden z-[9999]">
      <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-1/2 animate-top-progress" />
    </div>
  )
}
