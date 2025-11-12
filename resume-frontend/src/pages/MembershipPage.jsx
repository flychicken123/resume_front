import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  cancelUserSubscription,
  changeUserSubscriptionPlan,
  createCustomerPortalSession,
  createSubscriptionCheckoutSession,
  fetchAvailablePlans,
  fetchSubscriptionOverview,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./MembershipPage.css";

const formatPrice = (price) => {
  if (price == null) {
    return "$0";
  }
  if (typeof price === "number") {
    return `$${price.toFixed(2)}`;
  }
  const parsed = parseFloat(price);
  if (!Number.isNaN(parsed)) {
    return `$${parsed.toFixed(2)}`;
  }
  return typeof price === "string" && price.trim() !== "" ? price : "$0";
};

const normalizeFeatures = (features) => {
  if (!features) {
    return [];
  }
  if (Array.isArray(features)) {
    return features;
  }
  if (typeof features === "object") {
    const collected = [];
    Object.values(features).forEach((value) => {
      if (Array.isArray(value)) {
        collected.push(...value);
      } else if (typeof value === "string") {
        collected.push(value);
      }
    });
    return collected;
  }
  if (typeof features === "string") {
    return [features];
  }
  return [];
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const MembershipPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [actionState, setActionState] = useState({
    cancel: false,
    portal: false,
    switching: "",
  });

  const loadMembership = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subData, planList] = await Promise.all([
        fetchSubscriptionOverview(),
        fetchAvailablePlans(),
      ]);
      setSubscription(subData?.subscription || null);
      setUsage(subData?.usage || null);
      setPlans(planList);
    } catch (err) {
      console.error("Failed to load membership overview", err);
      setError(err?.message || "Failed to load membership details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadMembership();
    }
  }, [user, authLoading, loadMembership]);

  const currentPlanName = (subscription?.plan_name || "free").toLowerCase();
  const resumeLimit = subscription?.resume_limit || 0;
  const resumesRemaining = usage?.remaining ?? null;
  const renewDate = usage?.reset_date ? formatDate(usage.reset_date) : null;
  const usagePercent =
    resumeLimit > 0 && resumesRemaining != null
      ? Math.min(
          Math.max(((resumeLimit - resumesRemaining) / resumeLimit) * 100, 0),
          100
        )
      : 0;

  const planCards = useMemo(() => {
    return plans.map((plan) => {
      const normalizedName = (plan?.name || "").toLowerCase();
      const isCurrent = normalizedName === currentPlanName;
      const features = normalizeFeatures(plan?.features);
      const numericPrice =
        typeof plan?.price === "number"
          ? plan.price
          : parseFloat(plan?.price ?? "0");
      const isPaidPlan = !Number.isNaN(numericPrice) && numericPrice > 0;
      return {
        ...plan,
        normalizedName,
        isCurrent,
        features,
        isPaidPlan,
      };
    });
  }, [plans, currentPlanName]);

  const handleCancel = async () => {
    if (actionState.cancel) {
      return;
    }
    const confirmMessage =
      "Your membership will remain active until the end of the billing period. Do you still want to cancel?";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setActionState((prev) => ({ ...prev, cancel: true }));
    setStatusMessage("");
    setError("");
    try {
      await cancelUserSubscription();
      const endDate = renewDate
        ? ` You'll keep access until ${renewDate}.`
        : "";
      setStatusMessage(
        "Your membership will cancel at the end of the current period." +
          endDate
      );
      await loadMembership();
    } catch (err) {
      console.error("Failed to cancel subscription", err);
      setError(err?.message || "Failed to cancel membership. Please try again.");
    } finally {
      setActionState((prev) => ({ ...prev, cancel: false }));
    }
  };

  const handlePortal = async () => {
    if (actionState.portal) {
      return;
    }
    setActionState((prev) => ({ ...prev, portal: true }));
    setError("");
    try {
      const data = await createCustomerPortalSession();
      if (data?.portal_url) {
        window.location.href = data.portal_url;
      } else {
        throw new Error("Portal link unavailable. Please try again later.");
      }
    } catch (err) {
      console.error("Failed to launch billing portal", err);
      setError(err?.message || "Unable to open billing portal right now.");
    } finally {
      setActionState((prev) => ({ ...prev, portal: false }));
    }
  };

  const startCheckout = async (planName) => {
    setActionState((prev) => ({ ...prev, switching: planName }));
    setError("");
    setStatusMessage("");
    try {
      localStorage.setItem("postCheckoutReturn", "/account");
      const data = await createSubscriptionCheckoutSession(planName);
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("Unable to start checkout session.");
      }
    } catch (err) {
      console.error("Checkout session error", err);
      setError(err?.message || "Failed to start checkout session.");
      setActionState((prev) => ({ ...prev, switching: "" }));
    }
  };

  const switchPaidPlan = async (planName) => {
    setActionState((prev) => ({ ...prev, switching: planName }));
    setError("");
    setStatusMessage("");
    try {
      await changeUserSubscriptionPlan(planName);
      setStatusMessage("Your membership plan has been updated.");
      await loadMembership();
    } catch (err) {
      console.error("Failed to change plan", err);
      setError(err?.message || "Unable to update plan. Please try again.");
    } finally {
      setActionState((prev) => ({ ...prev, switching: "" }));
    }
  };

  const handleCardAction = (plan) => {
    if (plan.isCurrent) {
      return;
    }
    if (!plan.isPaidPlan) {
      handleCancel();
      return;
    }
    if (currentPlanName === "free") {
      startCheckout(plan.normalizedName);
    } else {
      switchPaidPlan(plan.normalizedName);
    }
  };

  if (!authLoading && !user) {
    return <Navigate to="/login" replace state={{ from: "/account" }} />;
  }

  return (
    <>
      <Navigation />
      <div className="membership-page">
        <div className="membership-container">
          <header className="membership-header">
            <span className="membership-eyebrow">Membership</span>
            <h1>Manage your HiHired membership</h1>
            <p>
              Update billing, review usage, or cancel with one click. Your plan
              adapts whenever your job search changes pace.
            </p>
          </header>

        {error && (
          <div className="membership-alert membership-alert-error">
            {error}
          </div>
        )}
        {statusMessage && !error && (
          <div className="membership-alert membership-alert-success">
            {statusMessage}
          </div>
        )}

        {loading ? (
          <div className="membership-loading">
            <div className="spinner" />
            <p>Loading your membership details...</p>
          </div>
        ) : (
          <>
            <section className="membership-summary">
              <div className="membership-summary-card">
                <div className="membership-summary-header">
                  <div>
                    <span className="membership-summary-label">
                      Current Plan
                    </span>
                    <h2>
                      {subscription?.display_name ||
                        subscription?.plan_name?.charAt(0).toUpperCase() +
                          (subscription?.plan_name?.slice(1) || "") ||
                        "Free Plan"}
                    </h2>
                  </div>
                  <span className="membership-summary-price">
                    {formatPrice(subscription?.price)}
                    <span className="membership-summary-period">
                      {subscription?.resume_period
                        ? ` / ${subscription.resume_period}`
                        : ""}
                    </span>
                  </span>
                </div>

                <p className="membership-summary-status">
                  Status:{" "}
                  <strong>
                    {subscription?.status
                      ? subscription.status.charAt(0).toUpperCase() +
                        subscription.status.slice(1)
                      : "Active"}
                  </strong>
                </p>

                {resumeLimit > 0 && resumesRemaining != null ? (
                  <>
                    <div className="membership-usage-bar">
                      <div
                        className="membership-usage-progress"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <p className="membership-usage-meta">
                      {resumesRemaining} of {resumeLimit} resumes remaining this{" "}
                      {subscription?.resume_period || "period"}
                    </p>
                  </>
                ) : (
                  <p className="membership-usage-meta">
                    Unlimited resume generations included.
                  </p>
                )}

                {renewDate && (
                  <p className="membership-renewal">
                    Renews on <strong>{renewDate}</strong>
                  </p>
                )}
              </div>

              <div className="membership-actions">
                {currentPlanName !== "free" && (
                  <button
                    className="membership-action-button membership-action-cancel"
                    onClick={handleCancel}
                    disabled={actionState.cancel}
                  >
                    {actionState.cancel ? "Processing..." : "Cancel membership"}
                  </button>
                )}
                <button
                  className="membership-action-button"
                  onClick={handlePortal}
                  disabled={actionState.portal}
                >
                  {actionState.portal
                    ? "Opening portal..."
                    : "Update billing & invoices"}
                </button>
                <Link className="membership-action-link" to="/pricing">
                  View detailed pricing →
                </Link>
              </div>
              {currentPlanName !== "free" && (
                <p className="membership-cancel-note">
                  {renewDate
                    ? `Cancelling keeps your plan active until ${renewDate}.`
                    : "Cancelling keeps your plan active until the end of this billing period."}
                </p>
              )}
            </section>

            <section className="membership-plans">
              <div className="membership-plans-header">
                <h3>Explore plan options</h3>
                <p>
                  Upgrade or switch plans whenever you need to scale resume
                  output or unlock additional AI coaching.
                </p>
              </div>

              <div className="membership-plan-grid">
                {planCards.map((plan) => (
                  <div
                    key={plan.id || plan.normalizedName}
                    className={`membership-plan-card ${
                      plan.isCurrent ? "membership-plan-card-current" : ""
                    }`}
                  >
                    <div className="membership-plan-heading">
                      <span className="membership-plan-name">
                        {plan.display_name || plan.name}
                      </span>
                      <span className="membership-plan-price">
                        {formatPrice(plan.price)}
                        {plan.resume_period ? (
                          <span className="membership-plan-period">
                            {" "}
                            / {plan.resume_period}
                          </span>
                        ) : null}
                      </span>
                    </div>

                    <ul className="membership-plan-features">
                      {plan.features.length > 0 ? (
                        plan.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))
                      ) : (
                        <li>AI resume builder access</li>
                      )}
                    </ul>

                    <button
                      className={`membership-plan-button ${
                        plan.isCurrent ? "membership-plan-button-disabled" : ""
                      }`}
                      onClick={() => handleCardAction(plan)}
                      disabled={
                        plan.isCurrent ||
                        actionState.cancel ||
                        actionState.switching === plan.normalizedName
                      }
                    >
                      {plan.isCurrent
                        ? "Current plan"
                        : actionState.switching === plan.normalizedName
                        ? "Updating..."
                        : plan.isPaidPlan
                        ? currentPlanName === "free"
                          ? "Upgrade"
                          : "Switch plan"
                        : "Switch to Free"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

          </>
        )}
        </div>
      </div>
    </>
  );
};

export default MembershipPage;
