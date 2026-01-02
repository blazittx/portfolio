import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getRawUsableAreaBounds, calculateCenterOffset } from "./grid";

export const generateCVPDF = async () => {
  const currentPath = window.location.pathname;
  const isOnCVPage = currentPath === "/cv";
  let elementsToRestore = [];

  try {
    if (isOnCVPage) {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    window.history.pushState(null, "", "/cv");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;
      const check = () => {
        const el = document.querySelector('[data-cv-page="true"]');
        if (el) {
          setTimeout(resolve, 1000);
          return;
        }
        if (attempts >= maxAttempts) {
          resolve();
          return;
        }
        attempts++;
        setTimeout(check, 100);
      };
      check();
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const cvPageElement = document.querySelector('[data-cv-page="true"]');
    if (!cvPageElement) throw new Error("CV page element not found");

    const selectorsToHide = [
      ".context-menu",
      ".toaster",
      '[data-widget-id="back-button"]',
    ];

    const recordHide = (el) => {
      elementsToRestore.push({
        element: el,
        display: el.style.display,
        visibility: el.style.visibility,
      });
      el.style.display = "none";
      el.style.visibility = "hidden";
    };

    selectorsToHide.forEach((selector) => {
      document.querySelectorAll(selector).forEach(recordHide);
    });

    const allElements = cvPageElement.querySelectorAll("*");

    /* allElements.forEach((el) => {
      const className =
        typeof el.className === "string"
          ? el.className
          : el.className?.baseVal || "";
      const id = el.id || "";
      const classStr = String(className);
      const idStr = String(id);

      if (
        classStr.includes("GridBackground") ||
        classStr.includes("GridMask") ||
        idStr.includes("grid") ||
        (el.style &&
          el.style.backgroundImage &&
          String(el.style.backgroundImage).includes("linear-gradient"))
      ) {
        recordHide(el);
      }
    }); */

    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const bc = style.borderColor || "";
      if (
        bc.includes("rgb(255, 100, 100)") ||
        bc.includes("rgba(255, 100, 100)")
      ) {
        recordHide(el);
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const centerOffset = calculateCenterOffset("cv-detail");
    const cvBounds = getRawUsableAreaBounds(centerOffset, "cv-detail");

    const cvAreaWidth = cvBounds.maxX - cvBounds.minX;
    const cvAreaHeight = cvBounds.maxY - cvBounds.minY;

    let canvas;
    try {
      canvas = await html2canvas(cvPageElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#000",
        x: cvBounds.minX,
        y: cvBounds.minY,
        width: cvAreaWidth,
        height: cvAreaHeight,
        scrollX: 0,
        scrollY: 0,
        allowTaint: true,
        removeContainer: false,
        foreignObjectRendering: false,
      });
    } catch (html2canvasError) {
      console.warn(
        "html2canvas failed with full options, trying minimal options:",
        html2canvasError
      );
      try {
        canvas = await html2canvas(cvPageElement, {
          scale: 1,
          useCORS: true,
          logging: false,
          backgroundColor: "#000",
          x: cvBounds.minX,
          y: cvBounds.minY,
          width: cvAreaWidth,
          height: cvAreaHeight,
          allowTaint: true,
          foreignObjectRendering: false,
        });
      } catch (minimalError) {
        throw new Error(
          `PDF generation failed: html2canvas cannot parse CSS with color() functions. Please try using the browser's print function (Ctrl+P) and save as PDF instead. Original error: ${minimalError.message}`
        );
      }
    }

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
      compress: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save("Doruk_Sasmaz_Game_Programmer_CV.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    elementsToRestore.forEach(({ element, display, visibility }) => {
      element.style.display = display;
      element.style.visibility = visibility;
    });

  }
};
