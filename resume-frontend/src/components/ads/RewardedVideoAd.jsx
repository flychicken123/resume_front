import React, { useEffect, useRef, useState } from "react";
import "./RewardedVideoAd.css";

// Google's test VAST tag URL - replace with your production VAST tag
const VAST_TAG_URL = "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=";

const RewardedVideoAd = ({ onComplete, onClose, onError }) => {
  const videoRef = useRef(null);
  const adContainerRef = useRef(null);
  const [adStatus, setAdStatus] = useState("loading"); // loading, playing, completed, error
  const [errorMessage, setErrorMessage] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);

  // IMA SDK references
  const adsLoaderRef = useRef(null);
  const adsManagerRef = useRef(null);

  useEffect(() => {
    // Check if IMA SDK is loaded
    if (!window.google || !window.google.ima) {
      setAdStatus("error");
      setErrorMessage("Ad system not available. Please try again later.");
      return;
    }

    initializeIMA();

    return () => {
      // Cleanup
      if (adsManagerRef.current) {
        adsManagerRef.current.destroy();
      }
    };
  }, []);

  const initializeIMA = () => {
    try {
      const adDisplayContainer = new window.google.ima.AdDisplayContainer(
        adContainerRef.current,
        videoRef.current
      );
      adDisplayContainer.initialize();

      const adsLoader = new window.google.ima.AdsLoader(adDisplayContainer);
      adsLoaderRef.current = adsLoader;

      // Add event listeners
      adsLoader.addEventListener(
        window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded,
        false
      );
      adsLoader.addEventListener(
        window.google.ima.AdErrorEvent.Type.AD_ERROR,
        onAdError,
        false
      );

      // Request ads
      const adsRequest = new window.google.ima.AdsRequest();
      adsRequest.adTagUrl = VAST_TAG_URL;
      adsRequest.linearAdSlotWidth = 640;
      adsRequest.linearAdSlotHeight = 480;
      adsRequest.nonLinearAdSlotWidth = 640;
      adsRequest.nonLinearAdSlotHeight = 150;

      adsLoader.requestAds(adsRequest);
    } catch (err) {
      console.error("IMA initialization error:", err);
      setAdStatus("error");
      setErrorMessage("Failed to initialize ad player.");
    }
  };

  const onAdsManagerLoaded = (adsManagerLoadedEvent) => {
    try {
      const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

      const adsManager = adsManagerLoadedEvent.getAdsManager(
        videoRef.current,
        adsRenderingSettings
      );
      adsManagerRef.current = adsManager;

      // Add event listeners
      adsManager.addEventListener(
        window.google.ima.AdErrorEvent.Type.AD_ERROR,
        onAdError
      );
      adsManager.addEventListener(
        window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
        onContentPauseRequested
      );
      adsManager.addEventListener(
        window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        onContentResumeRequested
      );
      adsManager.addEventListener(
        window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
        onAllAdsCompleted
      );
      adsManager.addEventListener(
        window.google.ima.AdEvent.Type.STARTED,
        onAdStarted
      );
      adsManager.addEventListener(
        window.google.ima.AdEvent.Type.AD_PROGRESS,
        onAdProgress
      );

      // Initialize and start
      adsManager.init(640, 480, window.google.ima.ViewMode.NORMAL);
      adsManager.start();
    } catch (err) {
      console.error("AdsManager error:", err);
      setAdStatus("error");
      setErrorMessage("Failed to load ad.");
    }
  };

  const onAdError = (adErrorEvent) => {
    console.error("Ad error:", adErrorEvent.getError());
    setAdStatus("error");
    setErrorMessage("Ad failed to load. Please try again.");
    if (adsManagerRef.current) {
      adsManagerRef.current.destroy();
    }
    if (onError) {
      onError(adErrorEvent.getError());
    }
  };

  const onContentPauseRequested = () => {
    // Pause content video if needed
  };

  const onContentResumeRequested = () => {
    // Resume content video if needed
  };

  const onAdStarted = (adEvent) => {
    setAdStatus("playing");
    const ad = adEvent.getAd();
    if (ad) {
      setTimeRemaining(Math.ceil(ad.getDuration()));
    }
  };

  const onAdProgress = (adEvent) => {
    const adData = adEvent.getAdData();
    if (adData && adData.duration && adData.currentTime) {
      setTimeRemaining(Math.ceil(adData.duration - adData.currentTime));
    }
  };

  const onAllAdsCompleted = () => {
    setAdStatus("completed");
    if (onComplete) {
      onComplete();
    }
  };

  const handleClose = () => {
    if (adStatus === "playing") {
      // Don't allow closing while ad is playing
      return;
    }
    if (adsManagerRef.current) {
      adsManagerRef.current.destroy();
    }
    onClose();
  };

  return (
    <div className="rewarded-video-overlay">
      <div className="rewarded-video-modal">
        <div className="rewarded-video-header">
          <h3>Watch Ad to Earn Credit</h3>
          {adStatus !== "playing" && (
            <button className="rewarded-video-close" onClick={handleClose}>
              &times;
            </button>
          )}
        </div>

        <div className="rewarded-video-content">
          {adStatus === "loading" && (
            <div className="rewarded-video-loading">
              <div className="rewarded-video-spinner"></div>
              <p>Loading ad...</p>
            </div>
          )}

          {adStatus === "error" && (
            <div className="rewarded-video-error">
              <p>{errorMessage}</p>
              <button onClick={handleClose}>Close</button>
            </div>
          )}

          {adStatus === "completed" && (
            <div className="rewarded-video-success">
              <p>Ad completed! You earned 1 credit.</p>
            </div>
          )}

          <div
            ref={adContainerRef}
            className="rewarded-video-container"
            style={{ display: adStatus === "playing" ? "block" : "none" }}
          >
            <video ref={videoRef} className="rewarded-video-player" />
          </div>

          {adStatus === "playing" && timeRemaining > 0 && (
            <div className="rewarded-video-timer">
              Ad ends in: {timeRemaining}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardedVideoAd;
