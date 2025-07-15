import { ImageLoader } from "next/image";

const imageLoader: ImageLoader = ({ src }: { src: string }) => {
  return src;
};

export default imageLoader;
