# Encar Car Image Scraper

A powerful Node.js scraper that extracts high-quality car images from Encar (Korean car marketplace) detail pages.

## Features

- 🚗 **Comprehensive Image Extraction**: Extracts all available car images from Encar detail pages
- 📁 **Organized Storage**: Automatically organizes images by custom folder names inside the images directory
- 🔄 **Multiple Extraction Strategies**: Uses various methods to ensure maximum image coverage
- 📊 **Progress Tracking**: Real-time progress updates during download
- 🛡️ **Error Handling**: Robust error handling with detailed logging
- ⚡ **Efficient**: Optimized for performance with respectful delays
- 🎯 **Interactive**: Prompts user for folder name and URL for easy customization
- 🔍 **Duplicate Detection**: Automatically detects and skips duplicate images to save bandwidth and storage

## Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
pnpm install
```

## Usage

### Interactive Usage (Recommended)

Simply run the scraper and follow the prompts:

```bash
node scrape_encar.js
```

The scraper will ask you for:
1. **Folder name**: The name of the folder where images will be saved (inside the `images` directory)
2. **Encar URL**: The URL of the car detail page you want to scrape

### Example Session

```
🚗 Encar Car Image Scraper
========================

📁 Enter the folder name (will be created inside 'images' folder): my_car_photos
🔗 Enter the Encar car detail page URL: https://fem.encar.com/cars/detail/40183372

📄 Target URL: https://fem.encar.com/cars/detail/40183372
📁 Folder: images/my_car_photos

🌍 Navigating to page...
⏳ Waiting for detail information section...
🔍 Extracting image URLs...
📦 Found 45 unique images
📥 Starting download of images...
✅ Successfully downloaded: 45 images
⏭️ Skipped duplicates: 0 images
📁 Images saved to: /path/to/images/my_car_photos
```

## Output

The scraper will:

1. Create an `images` folder in your project directory (if it doesn't exist)
2. Create a subfolder with your specified name (e.g., `my_car_photos`)
3. Download all available images as `image_1.jpg`, `image_2.jpg`, etc.
4. Skip any duplicate images to avoid wasting bandwidth

### Example Output Structure

```
encar-scraper/
├── scrape_encar.js
├── package.json
└── images/
    ├── my_car_photos/
    │   ├── image_1.jpg
    │   ├── image_2.jpg
    │   └── ... (all car images)
    └── another_car/
        ├── image_1.jpg
        └── ... (images from another car)
```

## How It Works

The scraper uses multiple strategies to extract images:

1. **Direct Image Extraction**: Finds all `<img>` tags with car picture URLs
2. **HTML Pattern Matching**: Uses regex to find image URLs in the page HTML
3. **Lazy Loading Support**: Extracts images from `data-src` attributes
4. **Swiper Gallery Support**: Handles images in carousel/slider components
5. **Button Image Extraction**: Finds images within button elements
6. **URL Pattern Generation**: Generates missing image URLs based on known patterns

### Duplicate Detection

The scraper includes intelligent duplicate detection:

- **Source URL Deduplication**: Removes duplicate image URLs (even with different query parameters)
- **File Existence Check**: Skips downloading if the file already exists
- **Clean URL Comparison**: Compares URLs without query parameters to identify duplicates
- **Detailed Reporting**: Shows how many duplicates were skipped and why

Example duplicate detection output:
```
⏭️ Skipping duplicate source: image_3.jpg (same as image_1.jpg)
⏭️ Skipping existing file: image_5.jpg
📊 Results:
✅ Successfully downloaded: 42 images
❌ Failed downloads: 0 images
⏭️ Skipped duplicates: 3 images
   - Duplicate sources: 2
   - Existing files: 1
```

## Configuration

### Customizing the Scraper

You can modify the following in `scrape_encar.js`:

- **Download Delay**: Adjust the delay between downloads (currently 100ms)
- **Image Quality**: Modify URL parameters for different image sizes
- **Browser Settings**: Customize Puppeteer browser options

### Browser Options

The scraper runs with these browser settings:

```javascript
const browser = await puppeteer.launch({ 
  headless: false,  // Set to true for headless mode
  defaultViewport: { width: 1920, height: 1080 },
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

## Troubleshooting

### Common Issues

1. **No images found**: 
   - Check if the URL is correct
   - Verify the page structure hasn't changed
   - Try running with `headless: false` to see what's happening

2. **Download failures**:
   - Check your internet connection
   - Some images might be temporarily unavailable
   - The scraper will continue with available images

3. **Timeout errors**:
   - Increase timeout values in the code
   - Check if the website is responding slowly

4. **Invalid folder name**:
   - Make sure the folder name is not empty
   - Avoid special characters that might cause file system issues

5. **Many duplicates skipped**:
   - This is normal if the same car has multiple image sizes
   - The scraper will only download unique images to save bandwidth

### Debug Mode

To see what's happening in the browser, keep `headless: false` in the browser launch options.

## Dependencies

- **puppeteer**: Browser automation
- **node-fetch**: HTTP requests for image downloads
- **fs**: File system operations
- **path**: Path utilities
- **readline**: Interactive command line interface

## Legal Notice

This scraper is for educational and personal use only. Please respect the website's terms of service and robots.txt file. Use responsibly and don't overload the server with requests.

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License. 