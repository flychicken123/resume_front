import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchSubscriptionOverview, fetchAdStatus, completeAdWatch } from "../api";
import RewardedVideoAd from "../components/ads/RewardedVideoAd";
import "./AdsRewardsPage.css";

const AdsRewardsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [canWatch, setCanWatch] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showVideoAd, setShowVideoAd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadData();
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setCanWatch(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const loadData = async () => {
    try {
      const [subRes, adRes] = await Promise.all([
        fetchSubscriptionOverview(),
        fetchAdStatus(),
      ]);

      // fetchSubscriptionOverview returns data directly, not wrapped in { data }
      if (subRes && subRes.usage) {
        setUsage(subRes.usage);
      }

      if (adRes.data) {
        setCanWatch(adRes.data.can_watch_ad);
        setCooldown(adRes.data.cooldown_remaining_seconds || 0);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setMessage({ type: "error", text: "Failed to load data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleAdComplete = async () => {
    setShowVideoAd(false);
    setMessage({ type: "info", text: "Processing your reward..." });

    try {
      const res = await completeAdWatch();
      if (res.data && res.data.success) {
        setMessage({ type: "success", text: "You earned 1 free resume credit!" });
        // Refresh data to show updated usage
        loadData();
      } else {
        setMessage({ type: "error", text: "Failed to grant credit. Please try again." });
      }
    } catch (err) {
      console.error("Failed to complete ad watch:", err);
      if (err.response && err.response.status === 429) {
        setMessage({ type: "error", text: "Please wait before watching another ad." });
        setCooldown(err.response.data.cooldown_remaining_seconds || 1800);
        setCanWatch(false);
      } else {
        setMessage({ type: "error", text: "Failed to grant credit. Please try again." });
      }
    }
  };

  const handleAdError = () => {
    setShowVideoAd(false);
    setMessage({ type: "error", text: "Ad failed to load. Please try again later." });
  };

  const handleAdClose = () => {
    setShowVideoAd(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <main className="ads-rewards-page">
        <div className="ads-rewards-loading">Loading...</div>
      </main>
    );
  }

  return (
    <main className="ads-rewards-page">
      <div className="ads-rewards-container">
        <h1>Ads Rewards</h1>
        <p className="ads-rewards-subtitle">
          Watch a short video ad to earn free resume credits!
        </p>

        {message && (
          <div className={`ads-rewards-message ads-rewards-message--${message.type}`}>
            {message.text}
          </div>
        )}

        {usage && (
          <div className="ads-rewards-usage">
            <div className="ads-rewards-usage-label">Your usage this period:</div>
            <div className="ads-rewards-usage-stats">
              <span className="ads-rewards-usage-used">
                {usage.limit ? `${usage.limit - usage.remaining} / ${usage.limit}` : `${usage.remaining} remaining`}
              </span>
              {usage.limit && (
                <span className="ads-rewards-usage-remaining">
                  ({usage.remaining} remaining)
                </span>
              )}
            </div>
          </div>
        )}

        <div className="ads-rewards-action">
          {canWatch ? (
            <button
              className="ads-rewards-watch-btn"
              onClick={() => setShowVideoAd(true)}
            >
              Watch Ad to Get +1 Resume
            </button>
          ) : (
            <div className="ads-rewards-cooldown">
              <p>Next ad available in:</p>
              <div className="ads-rewards-timer">{formatTime(cooldown)}</div>
            </div>
          )}
        </div>

        <div className="ads-rewards-info">
          <h3>How it works</h3>
          <ul>
            <li>Watch a short video ad (15-30 seconds)</li>
            <li>Earn 1 free resume credit after the ad completes</li>
            <li>You can watch 1 ad every 30 minutes</li>
            <li>Credits can be used to generate additional resumes</li>
          </ul>
        </div>
      </div>

      {showVideoAd && (
        <RewardedVideoAd
          onComplete={handleAdComplete}
          onClose={handleAdClose}
          onError={handleAdError}
        />
      )}
    </main>
  );
};

export default AdsRewardsPage;
