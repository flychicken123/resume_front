import React, { useEffect, useState, useRef, useCallback } from "react";
import "./RewardedAdDisplay.css";

const AD_VIEW_DURATION = 20; // seconds user must view the ad
const AD_SLOT = "8585235164";

const RewardedAdDisplay = ({ onComplete, onClose, onError }) => {
  const [adStatus, setAdStatus] = useState("loading"); // loading, viewing, completed, error
  const [countdown, setCountdown] = useState(AD_VIEW_DURATION);
  const adRef = useRef(null);
  const timerRef = useRef(null);
  const adLoadedRef = useRef(false);

  const startCountdown = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setAdStatus("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const pushAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        detectAdLoad();
      } catch (err) {
        console.error("AdSense push error:", err);
        setAdStatus("error");
        if (onError) onError(err);
      }
    };

    // Small delay to ensure the DOM ins element is rendered
    const timeout = setTimeout(pushAd, 100);

    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const detectAdLoad = () => {
    if (!adRef.current) return;

    // Watch for AdSense injecting an iframe into the ad container
    const observer = new MutationObserver(() => {
      const iframe = adRef.current?.querySelector("iframe");
      if (iframe) {
        observer.disconnect();
        adLoadedRef.current = true;
        setAdStatus("viewing");
        startCountdown();
      }
    });

    observer.observe(adRef.current, { childList: true, subtree: true });

    // Fallback: if no iframe after 5 seconds, check for any content
    setTimeout(() => {
      if (adLoadedRef.current) return;
      observer.disconnect();

      const hasContent =
        adRef.current &&
        (adRef.current.querySelector("iframe") ||
          adRef.current.children.length > 1);

      if (hasContent) {
        adLoadedRef.current = true;
      }

      // Start countdown regardless — AdSense may still be pending approval
      // Once approved, real ads will render automatically
      setAdStatus("viewing");
      startCountdown();
    }, 5000);
  };

  const handleClaim = () => {
    if (onComplete) onComplete();
  };

  const handleClose = () => {
    if (adStatus === "viewing") return; // Don't allow closing during countdown
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  return (
    <div className="rewarded-ad-overlay">
      <div className="rewarded-ad-modal">
        <div className="rewarded-ad-header">
          <h3>View Ad to Earn Credit</h3>
          {adStatus !== "viewing" && (
            <button className="rewarded-ad-close" onClick={handleClose}>
              &times;
            </button>
          )}
        </div>

        <div className="rewarded-ad-content">
          {adStatus === "loading" && (
            <div className="rewarded-ad-loading">
              <div className="rewarded-ad-spinner"></div>
              <p>Loading ad...</p>
            </div>
          )}

          {adStatus === "error" && (
            <div className="rewarded-ad-error">
              <p>Ad failed to load. Please disable your ad blocker and try again.</p>
              <button onClick={handleClose}>Close</button>
            </div>
          )}

          <div
            ref={adRef}
            className="rewarded-ad-container"
            style={{
              display:
                adStatus === "loading" || adStatus === "error"
                  ? "none"
                  : "block",
            }}
          >
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: "100%", height: "280px" }}
              data-ad-client="ca-pub-8458868058919665"
              data-ad-slot={AD_SLOT}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>

          {adStatus === "viewing" && (
            <div className="rewarded-ad-timer">Please wait: {countdown}s</div>
          )}

          {adStatus === "completed" && (
            <div className="rewarded-ad-success">
              <p>Ad viewed! Click below to claim your credit.</p>
              <button className="rewarded-ad-claim-btn" onClick={handleClaim}>
                Claim +1 Resume Credit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardedAdDisplay;
