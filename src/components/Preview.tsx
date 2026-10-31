interface PreviewProps {
  code: string;
}

export default function Preview({ code }: PreviewProps) {
  return (
    <iframe
      title="preview"
      srcDoc={code}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
        backgroundColor: "#ffffff",
      }}
    />
  );
}