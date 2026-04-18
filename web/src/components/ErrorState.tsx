interface ErrorStateProps {
  title?: string;
  message?: string;
}

export function ErrorState({ title = "Something went wrong", message = "Please try again." }: ErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-xl text-center">
        <h1 className="text-xl font-semibold text-red-300">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}
