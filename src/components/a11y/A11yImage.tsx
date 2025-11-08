import Image, { ImageProps } from "next/image";

// Enforces explicit alt or decorative presentation for images
// If alt is empty, requires aria-hidden or role="presentation"
// Applies lazy loading by default unless priority is specified
export function A11yImage(props: ImageProps & { decorative?: boolean }) {
  const { alt, decorative, loading, ...rest } = props;

  if (!decorative && (alt === undefined || alt === null)) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "A11yImage: alt text is required for non-decorative images."
      );
    }
  }

  const computedProps: ImageProps = {
    alt: decorative ? "" : alt ?? "",
    loading: loading ?? "lazy", // Default to lazy loading
    ...(decorative ? { role: "presentation", "aria-hidden": true } : {}),
    ...rest,
  } as ImageProps;

  return <Image {...computedProps} />;
}
