interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card w-full max-w-md text-center">
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}
