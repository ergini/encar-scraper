import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import readline from "readline";

const downloadImage = async (url, filepath) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`❌ Failed to download: ${url} (${res.status})`);
      return false;
    }
    const buffer = await res.arrayBuffer();
    await fs.promises.writeFile(filepath, Buffer.from(buffer));
    console.log(`✅ Saved: ${filepath}`);
    return true;
  } catch (error) {
    console.log(`❌ Error downloading ${url}: ${error.message}`);
    return false;
  }
};

const extractCarId = (url) => {
  const match = url.match(/\/detail\/(\d+)/);
  return match ? match[1] : "unknown";
};

const askQuestion = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Function to check if file already exists
const fileExists = (filepath) => {
  try {
    return fs.existsSync(filepath);
  } catch (error) {
    return false;
  }
};

// Function to get clean URL without query parameters for comparison
const getCleanUrl = (url) => {
  return url.split("?")[0];
};

// Function to save car link to JSON file
const saveCarLink = (url, folderName) => {
  try {
    const dataFile = path.join(process.cwd(), "car_links.json");
    let carLinks = [];

    // Read existing data if file exists
    if (fs.existsSync(dataFile)) {
      const existingData = fs.readFileSync(dataFile, "utf8");
      carLinks = JSON.parse(existingData);
    }

    // Add new car link with timestamp
    const carLink = {
      url: url,
      folderName: folderName,
      timestamp: new Date().toISOString(),
      carId: extractCarId(url),
    };

    carLinks.push(carLink);

    // Save back to file
    fs.writeFileSync(dataFile, JSON.stringify(carLinks, null, 2));
    console.log(`💾 Car link saved to: ${dataFile}`);
  } catch (error) {
    console.log(`⚠️ Could not save car link: ${error.message}`);
  }
};

(async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("🚗 Encar Car Image Scraper");
    console.log("========================\n");

    // Get folder name from user
    const folderName = await askQuestion(
      rl,
      "📁 Enter the folder name (will be created inside 'images' folder): "
    );

    if (!folderName) {
      console.log("❌ Folder name cannot be empty!");
      rl.close();
      return;
    }

    // Get URL from user
    const url = await askQuestion(
      rl,
      "🔗 Enter the Encar car detail page URL: "
    );

    if (!url || !url.includes("encar.com")) {
      console.log("❌ Please enter a valid Encar URL!");
      rl.close();
      return;
    }

    rl.close();

    console.log(`\n📄 Target URL: ${url}`);
    console.log(`📁 Folder: images/${folderName}\n`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      // defaultViewport: { width: 1920, height: 1080 },
    });

    const page = await browser.newPage();

    try {
      console.log("🌍 Navigating to page...");
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

      console.log("⏳ Waiting for detail information section...");
      await page.waitForSelector("#detailInfomation", { timeout: 30000 });

      // Wait for the page to fully load
      console.log("⏳ Waiting for page to fully load...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extract all image URLs using multiple strategies
      console.log("🔍 Extracting image URLs...");
      const imageUrls = await page.evaluate(() => {
        const images = [];

        // Strategy 1: Extract from all img tags with car picture URLs
        const allImages = document.querySelectorAll(
          'img[src*="ci.encar.com/carpicture"]'
        );
        allImages.forEach((img) => {
          const src = img.src || img.getAttribute("data-src");
          if (
            src &&
            src !== "/assets/images/common/trans.gif" &&
            src.includes("carpicture")
          ) {
            images.push(src);
          }
        });

        // Strategy 2: Look for specific image patterns in the HTML
        const htmlContent = document.documentElement.outerHTML;
        const imagePattern =
          /https:\/\/ci\.encar\.com\/carpicture\/carpicture\d+\/pic\d+\/\d+_\d+\.jpg[^"'\s]*/g;
        const matches = htmlContent.match(imagePattern);
        if (matches) {
          matches.forEach((match) => {
            if (!images.includes(match)) {
              images.push(match);
            }
          });
        }

        // Strategy 3: Extract from data-src attributes (lazy loaded images)
        const lazyImages = document.querySelectorAll(
          'img[data-src*="ci.encar.com/carpicture"]'
        );
        lazyImages.forEach((img) => {
          const src = img.getAttribute("data-src");
          if (
            src &&
            src !== "/assets/images/common/trans.gif" &&
            src.includes("carpicture")
          ) {
            images.push(src);
          }
        });

        // Strategy 4: Look for images in swiper slides
        const swiperImages = document.querySelectorAll(
          '.swiper-slide img[src*="ci.encar.com"]'
        );
        swiperImages.forEach((img) => {
          const src = img.src || img.getAttribute("data-src");
          if (
            src &&
            src !== "/assets/images/common/trans.gif" &&
            src.includes("carpicture")
          ) {
            images.push(src);
          }
        });

        // Strategy 5: Look for images in button elements
        const buttonImages = document.querySelectorAll(
          'button img[src*="ci.encar.com"]'
        );
        buttonImages.forEach((img) => {
          const src = img.src || img.getAttribute("data-src");
          if (
            src &&
            src !== "/assets/images/common/trans.gif" &&
            src.includes("carpicture")
          ) {
            images.push(src);
          }
        });

        // Remove duplicates and normalize URLs
        const uniqueImages = [...new Set(images)]
          .map((url) => {
            // Convert to full size if it's a thumbnail
            return url.replace(/rh=\d+&cw=\d+&ch=\d+/, "rh=696&cw=1160&ch=696");
          })
          .filter(
            (url) =>
              url && url.includes("ci.encar.com") && !url.includes("trans.gif")
          );

        console.log(`Found ${uniqueImages.length} unique images`);
        return uniqueImages;
      });

      console.log(`📦 Found ${imageUrls.length} unique images`);

      // If we still don't have enough images, try to generate them based on the pattern
      if (imageUrls.length < 15) {
        console.log(
          "🔄 Trying to generate missing images based on URL pattern..."
        );

        // Extract the base pattern from existing images
        const basePattern = imageUrls[0]?.match(
          /https:\/\/ci\.encar\.com\/carpicture\/carpicture\d+\/pic\d+\/(\d+)_\d+\.jpg/
        );
        if (basePattern) {
          const baseNumber = basePattern[1];
          const baseUrl = `https://ci.encar.com/carpicture/carpicture08/pic${baseNumber}/${baseNumber}`;

          // Generate URLs for images 001-024 (common pattern)
          for (let i = 1; i <= 24; i++) {
            const imageNumber = i.toString().padStart(3, "0");
            const generatedUrl = `${baseUrl}_${imageNumber}.jpg?impolicy=heightRate&rh=696&cw=1160&ch=696&cg=Center&wtmk=https://ci.encar.com/wt_mark/w_mark_04.png&t=20250805151805`;

            if (!imageUrls.includes(generatedUrl)) {
              imageUrls.push(generatedUrl);
            }
          }
        }
      }

      // Remove duplicates again and create a map for tracking
      const finalImageUrls = [...new Set(imageUrls)].filter(
        (url) =>
          url && url.includes("ci.encar.com") && !url.includes("trans.gif")
      );

      console.log(`📦 Final count: ${finalImageUrls.length} unique images`);

      if (finalImageUrls.length === 0) {
        console.log(
          "❌ No images found. Please check if the URL is correct or the page structure has changed."
        );
        await browser.close();
        return;
      }

      // Create images folder with user-specified folder name
      const folder = path.join(process.cwd(), "images", folderName);
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }

      // Check for existing files and create a map of clean URLs to avoid duplicates
      const existingFiles = fs
        .readdirSync(folder)
        .filter((file) => file.match(/^image_\d+\.(jpg|jpeg|png|gif)$/i));

      const existingUrls = new Set();
      existingFiles.forEach((file) => {
        // Try to reconstruct the original URL from existing files
        const filePath = path.join(folder, file);
        try {
          // This is a simplified approach - in practice, you might want to store URLs in a metadata file
          console.log(`📁 Found existing file: ${file}`);
        } catch (error) {
          // File exists but we can't determine the original URL
        }
      });

      // Create a map to track unique clean URLs (without query parameters)
      const uniqueCleanUrls = new Map();
      const duplicateCount = { src: 0, file: 0 };

      // Download all images with progress tracking and duplicate detection
      console.log("📥 Starting download of images...");
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (let [index, src] of finalImageUrls.entries()) {
        if (src) {
          const cleanSrc = getCleanUrl(src);
          const fileName = `image_${index + 1}${path.extname(cleanSrc)}`;
          const filePath = path.join(folder, fileName);

          // Check for duplicate source URLs
          if (uniqueCleanUrls.has(cleanSrc)) {
            console.log(
              `⏭️ Skipping duplicate source: ${fileName} (same as ${uniqueCleanUrls.get(
                cleanSrc
              )})`
            );
            skippedCount++;
            duplicateCount.src++;
            continue;
          }

          // Check if file already exists
          if (fileExists(filePath)) {
            console.log(`⏭️ Skipping existing file: ${fileName}`);
            skippedCount++;
            duplicateCount.file++;
            continue;
          }

          console.log(
            `📥 Downloading ${index + 1}/${finalImageUrls.length}: ${fileName}`
          );
          const success = await downloadImage(src, filePath);

          if (success) {
            successCount++;
            uniqueCleanUrls.set(cleanSrc, fileName);
          } else {
            failedCount++;
          }

          // Add a small delay between downloads to be respectful
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(`🎉 Download complete!`);
      console.log(`✅ Successfully downloaded: ${successCount} images`);
      console.log(`❌ Failed downloads: ${failedCount} images`);
      console.log(`⏭️ Skipped duplicates: ${skippedCount} images`);
      if (duplicateCount.src > 0) {
        console.log(`   - Duplicate sources: ${duplicateCount.src}`);
      }
      if (duplicateCount.file > 0) {
        console.log(`   - Existing files: ${duplicateCount.file}`);
      }
      console.log(`📁 Images saved to: ${folder}`);

      // Save car link to JSON file
      saveCarLink(url, folderName);

      // Open the folder after download is complete
      console.log(`🔍 Opening folder...`);
      try {
        const { exec } = await import("child_process");
        exec(`open "${folder}"`, (error) => {
          if (error) {
            console.log(
              `⚠️ Could not open folder automatically: ${error.message}`
            );
            console.log(`📁 Please manually open: ${folder}`);
          } else {
            console.log(`✅ Folder opened successfully!`);
          }
        });
      } catch (error) {
        console.log(`⚠️ Could not open folder automatically: ${error.message}`);
        console.log(`📁 Please manually open: ${folder}`);
      }
    } catch (error) {
      console.error("❌ An error occurred:", error.message);
    } finally {
      // Try to close any open modals
      try {
        const closeButton = await page.$(
          '.DetailPhotoGallery_btn_close__M7WYe, [class*="btn_close"]'
        );
        if (closeButton) {
          await closeButton.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.log("Note: Could not close modal");
      }

      await browser.close();
      console.log("🔚 Browser closed");
    }
  } catch (error) {
    console.error("❌ An error occurred:", error.message);
    rl.close();
  }
})();
