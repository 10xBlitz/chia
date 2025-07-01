import Image from "next/image";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./ui/dialog";
import { DetailedHTMLProps, ImgHTMLAttributes, useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export default function ZoomableImage({
  src,
  alt,
  className,
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
  const [imgLoaded, setImgLoaded] = useState(false);
  if (!src || typeof src !== "string") return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Image
          src={src}
          alt={alt || ""}
          sizes="100vw"
          className={
            className +
            " cursor-zoom-in transition-transform hover:scale-[1.02]"
          }
          style={{ width: "100%", height: "auto" }}
          width={500}
          height={100}
          priority={false}
        />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl bg-transparent shadow-none border-none p-0"
        aria-label={alt || "Zoomed image"}
      >
        <DialogTitle className="sr-only">
          이미지 확대 보기 {/* Zoomed Image */}
        </DialogTitle>
        <div className="relative h-[calc(100vh-220px)] w-full overflow-clip rounded-md bg-transparent flex items-center justify-center">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
              <span className="text-gray-400 text-sm animate-pulse">
                이미지 불러오는 중... {/* Loading image... */}
              </span>
            </div>
          )}
          <div className="relative max-w-full max-h-full">
            <Image
              src={src}
              alt={alt || ""}
              width={1200}
              height={800}
              className={
                "max-w-full max-h-full object-contain transition-opacity duration-300 " +
                (imgLoaded ? "opacity-100" : "opacity-0")
              }
              onLoad={() => setImgLoaded(true)}
              draggable={false}
              tabIndex={0}
              style={{ width: "auto", height: "auto" }}
            />
            <DialogClose asChild>
              <button
                aria-label="Close"
                className="absolute right-1 -top-10 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                type="button"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
