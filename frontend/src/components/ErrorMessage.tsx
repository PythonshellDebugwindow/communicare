export default function ErrorMessage({ message }: { message: string }) {
  return message && <p className="error-message">{message}</p>;
}
