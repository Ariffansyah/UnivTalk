import { Filter } from "bad-words";
import * as nsfwjs from "nsfwjs";

const filter = new Filter();

const indonesianBadWords = [
  "kontol",
  "memek",
  "ngentot",
  "jancok",
  "anjing",
  "bangsat",
  "asu",
  "bajingan",
  "babi",
  "kimak",
  "pukimak",
  "pepek",
  "tolol",
  "goblok",
  "tai",
];

const nsfwWords = [
  "porn",
  "xxx",
  "nsfw",
  "sex",
  "nude",
  "naked",
  "pussy",
  "dick",
  "cock",
  "boobs",
  "tits",
  "ass",
  "fuck",
  "shit",
  "bitch",
  "slut",
  "whore",
];

filter.addWords(...indonesianBadWords, ...nsfwWords);

export const containsBadWords = (text: string): boolean => {
  if (!text || text.trim() === "") return false;
  return filter.isProfane(text);
};

export const cleanBadWords = (text: string): string => {
  if (!text) return "";
  return filter.clean(text);
};

export const validateForumContent = (
  title: string,
  description: string,
): { isValid: boolean; error: string } => {
  if (containsBadWords(title)) {
    return {
      isValid: false,
      error: "Forum name contains inappropriate or offensive language",
    };
  }

  if (containsBadWords(description)) {
    return {
      isValid: false,
      error: "Description contains inappropriate or offensive language",
    };
  }

  return { isValid: true, error: "" };
};

let nsfwModel: nsfwjs.NSFWJS | null = null;
let modelLoading = false;

export const loadNSFWModel = async (): Promise<nsfwjs.NSFWJS> => {
  if (nsfwModel) return nsfwModel;

  if (modelLoading) {
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (nsfwModel) {
          clearInterval(checkInterval);
          resolve(nsfwModel);
        }
      }, 100);
    });
    return nsfwModel!;
  }

  try {
    modelLoading = true;
    nsfwModel = await nsfwjs.load();
    modelLoading = false;
    console.log("✅ NSFW model loaded successfully");
    return nsfwModel;
  } catch (error) {
    modelLoading = false;
    console.error("❌ Failed to load NSFW model:", error);
    throw new Error("Failed to load content moderation model");
  }
};

export interface NSFWPrediction {
  className: string;
  probability: number;
}

export interface NSFWResult {
  safe: boolean;
  predictions: NSFWPrediction[];
  riskLevel: "safe" | "low" | "medium" | "high";
  details: {
    porn: number;
    sexy: number;
    hentai: number;
    neutral: number;
    drawing: number;
  };
}

export const checkImageNSFW = async (imageFile: File): Promise<NSFWResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!imageFile.type.startsWith("image/")) {
        reject(new Error("File must be an image"));
        return;
      }

      const img = document.createElement("img");
      const url = URL.createObjectURL(imageFile);

      img.onload = async () => {
        try {
          const model = await loadNSFWModel();
          const predictions = await model.classify(img);

          URL.revokeObjectURL(url);

          const pornScore =
            predictions.find((p) => p.className === "Porn")?.probability || 0;
          const sexyScore =
            predictions.find((p) => p.className === "Sexy")?.probability || 0;
          const hentaiScore =
            predictions.find((p) => p.className === "Hentai")?.probability || 0;
          const neutralScore =
            predictions.find((p) => p.className === "Neutral")?.probability ||
            0;
          const drawingScore =
            predictions.find((p) => p.className === "Drawing")?.probability ||
            0;

          let riskLevel: "safe" | "low" | "medium" | "high" = "safe";
          let isSafe = true;

          if (pornScore > 0.7 || hentaiScore > 0.7) {
            riskLevel = "high";
            isSafe = false;
          } else if (pornScore > 0.5 || sexyScore > 0.7 || hentaiScore > 0.5) {
            riskLevel = "medium";
            isSafe = false;
          } else if (pornScore > 0.3 || sexyScore > 0.5) {
            riskLevel = "low";
            isSafe = false;
          }

          resolve({
            safe: isSafe,
            predictions,
            riskLevel,
            details: {
              porn: pornScore,
              sexy: sexyScore,
              hentai: hentaiScore,
              neutral: neutralScore,
              drawing: drawingScore,
            },
          });
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
};

export const checkImageURLNSFW = async (
  imageUrl: string,
): Promise<NSFWResult> => {
  return new Promise(async (resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      try {
        const model = await loadNSFWModel();
        const predictions = await model.classify(img);

        const pornScore =
          predictions.find((p) => p.className === "Porn")?.probability || 0;
        const sexyScore =
          predictions.find((p) => p.className === "Sexy")?.probability || 0;
        const hentaiScore =
          predictions.find((p) => p.className === "Hentai")?.probability || 0;
        const neutralScore =
          predictions.find((p) => p.className === "Neutral")?.probability || 0;
        const drawingScore =
          predictions.find((p) => p.className === "Drawing")?.probability || 0;

        let riskLevel: "safe" | "low" | "medium" | "high" = "safe";
        let isSafe = true;

        if (pornScore > 0.7 || hentaiScore > 0.7) {
          riskLevel = "high";
          isSafe = false;
        } else if (pornScore > 0.5 || sexyScore > 0.7 || hentaiScore > 0.5) {
          riskLevel = "medium";
          isSafe = false;
        } else if (pornScore > 0.3 || sexyScore > 0.5) {
          riskLevel = "low";
          isSafe = false;
        }

        resolve({
          safe: isSafe,
          predictions,
          riskLevel,
          details: {
            porn: pornScore,
            sexy: sexyScore,
            hentai: hentaiScore,
            neutral: neutralScore,
            drawing: drawingScore,
          },
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image from URL"));
    };

    img.src = imageUrl;
  });
};

export const validateImage = (
  file: File,
  maxSizeMB: number = 5,
): { isValid: boolean; error: string } => {
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "Please upload an image file (JPG, PNG, GIF, etc.)",
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Image size must be less than ${maxSizeMB}MB`,
    };
  }

  return { isValid: true, error: "" };
};

export interface VideoModerationResult {
  safe: boolean;
  totalFrames: number;
  unsafeFrames: number;
  safetyScore: number;
  frames: NSFWResult[];
}

export const moderateVideo = async (
  videoFile: File,
  framesToCheck: number = 5,
): Promise<VideoModerationResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onloadedmetadata = async () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const duration = video.duration;
        const interval = duration / framesToCheck;

        const frameResults: NSFWResult[] = [];
        let unsafeCount = 0;

        for (let i = 0; i < framesToCheck; i++) {
          video.currentTime = i * interval;

          await new Promise<void>((resolveFrame) => {
            video.onseeked = async () => {
              ctx.drawImage(video, 0, 0);

              canvas.toBlob(async (blob) => {
                if (blob) {
                  const file = new File([blob], "frame.jpg", {
                    type: "image/jpeg",
                  });
                  const result = await checkImageNSFW(file);
                  frameResults.push(result);

                  if (!result.safe) {
                    unsafeCount++;
                  }
                }
                resolveFrame();
              }, "image/jpeg");
            };
          });
        }

        URL.revokeObjectURL(url);

        const safetyScore =
          ((framesToCheck - unsafeCount) / framesToCheck) * 100;

        resolve({
          safe: unsafeCount === 0,
          totalFrames: framesToCheck,
          unsafeFrames: unsafeCount,
          safetyScore,
          frames: frameResults,
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video"));
    };
  });
};

export default filter;
