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
          fill
          sizes="100vw"
          className={
            className +
            " cursor-zoom-in transition-transform hover:scale-[1.02] object-cover"
          }
          priority={false}
        />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="bg-transparent shadow-none border-none p-0 w-fit h-fit max-w-[95vw] max-h-[95vh]"
        aria-label={alt || "Zoomed image"}
      >
        <DialogTitle className="sr-only">
          이미지 확대 보기 {/* Zoomed Image */}
        </DialogTitle>
        <div className="relative w-fit h-fit bg-transparent">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 rounded-md">
              <span className="text-gray-400 text-sm animate-pulse">
                이미지 불러오는 중... {/* Loading image... */}
              </span>
            </div>
          )}
          <div className="relative">
            <Image
              src={src}
              alt={alt || ""}
              width={1200}
              height={800}
              className={
                "object-contain transition-opacity duration-300 rounded-md " +
                (imgLoaded ? "opacity-100" : "opacity-0")
              }
              onLoad={() => setImgLoaded(true)}
              draggable={false}
              tabIndex={0}
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "95vw",
                maxHeight: "95vh",
              }}
            />
            <DialogClose asChild>
              <button
                aria-label="Close"
                className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                type="button"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
