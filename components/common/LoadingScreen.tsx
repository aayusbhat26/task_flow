export const LoadingScreen = () => {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:px-8"
    >
      <div className="animate-pulse">
        <div className="h-2 w-24 rounded-sm bg-muted" />
        <div className="mt-4 h-9 w-[62%] max-w-[460px] rounded-sm bg-muted" />
        <div className="mt-4 h-3 w-full max-w-[540px] rounded-sm bg-muted/70" />
        <div className="mt-8 h-px w-full bg-border" />
        <div className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex flex-col gap-4 bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 rounded-sm bg-muted" />
                <div className="h-3 w-3 rounded-full bg-muted" />
              </div>
              <div className="h-8 w-24 rounded-sm bg-muted" />
              <div className="h-3 w-full rounded-sm bg-muted/70" />
            </div>
          ))}
        </div>
        <div className="mt-7 space-y-px border border-border bg-border">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 bg-card p-4">
              <div className="h-9 w-9 rounded-sm bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-[42%] rounded-sm bg-muted" />
                <div className="h-2.5 w-[24%] rounded-sm bg-muted/70" />
              </div>
              <div className="h-3 w-14 rounded-sm bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading content</span>
    </div>
  );
};
