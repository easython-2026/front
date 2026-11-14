
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import {
  getConsents,
  updateConsents,
} from "../../api/user";

import {
  SettingsBadge,
  SettingsHeader,
  SettingsIcon,
  SettingsNotice,
  settingsError,
  unwrap,
} from "../../components/SettingsPageUI";

const definitions = {
  camera: {
    title: "카메라 권한",
    field: "camera",
    apiName: "camera",
    icon: "camera",
    intro: "출퇴근 현장 사진을 촬영할 때 사용해요.",
    usage: "출퇴근 인증 사진 촬영 및 증거 보관",
    note: "사진 촬영 시에만 카메라를 사용하며 권한 확인 후 카메라 스트림을 종료합니다.",
  },
  location: {
    title: "위치 권한",
    field: "location",
    apiName: "geolocation",
    icon: "pin",
    intro: "근무장소에서 출퇴근하는지 GPS로 확인해요.",
    usage: "설정된 근무장소와 현재 위치 비교",
    note: "현재 위치를 확인하려면 기기 위치 서비스가 켜져 있어야 합니다.",
  },
};

const browserLabels = {
  granted: "허용됨",
  denied: "차단됨",
  prompt: "요청 전",
  unknown: "확인 불가",
};

export default function PermissionSettings() {
  const { type } = useParams();
  const config = definitions[type];

  const [consent, setConsent] = useState(null);
  const [browserState, setBrowserState] = useState("unknown");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const checkBrowser = useCallback(async () => {
    if (!config || !navigator.permissions?.query) {
      return "unknown";
    }

    try {
      const status = await navigator.permissions.query({
        name: config.apiName,
      });

      setBrowserState(status.state);
      return status.state;
    } catch {
      return "unknown";
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;

    let active = true;

    setLoading(true);
    setError("");
    setMessage("");
    setConsent(null);
    setBrowserState("unknown");

    getConsents()
      .then((result) => {
        const data = unwrap(result);

        if (typeof data?.[config.field] !== "boolean") {
          throw new Error(
            "서버 동의 상태를 확인할 수 없습니다."
          );
        }

        if (active) {
          setConsent(data[config.field]);
        }
      })
      .catch((err) => {
        if (active) {
          setError(settingsError(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    checkBrowser();

    return () => {
      active = false;
    };
  }, [config, reload, checkBrowser]);

  // 실제 브라우저 권한 확인
  async function testPermission() {
    if (!config || checking) return;

    setChecking(true);
    setError("");
    setMessage("");

    try {
      if (type === "camera") {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "이 브라우저에서는 카메라 요청을 지원하지 않습니다. HTTPS 환경을 확인해 주세요."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

        // 테스트 종료 즉시 카메라 해제
        stream
          .getTracks()
          .forEach((track) => track.stop());

        setBrowserState("granted");
      } else {
        if (!navigator.geolocation) {
          throw new Error(
            "이 브라우저에서는 위치 확인을 지원하지 않습니다."
          );
        }

        await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 12000,
              maximumAge: 0,
            }
          )
        );

        setBrowserState("granted");
      }

      setMessage(
        "기기 권한을 확인했습니다. 서비스 이용 동의와는 별개입니다."
      );
    } catch (err) {
      if (
        err?.name === "NotAllowedError" ||
        err?.code === 1
      ) {
        setBrowserState("denied");
      }

      setError(
        err?.message ??
        "기기 권한을 확인하지 못했습니다."
      );
    } finally {
      await checkBrowser();
      setChecking(false);
    }
  }

  // 서버에 저장되는 선택 동의 변경
  async function changeConsent() {
    if (
      typeof consent !== "boolean" ||
      saving
    ) {
      return;
    }

    const next = !consent;

    if (
      !next &&
      !window.confirm(
        `${config.title}에 대한 서비스 동의를 철회하시겠습니까? 출퇴근 인증 기능이 제한될 수 있습니다.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateConsents({
        [config.field]: next,
      });

      // 서버 저장값 재조회
      const data = unwrap(
        await getConsents()
      );

      if (data?.[config.field] !== next) {
        throw new Error(
          "서버 저장값이 변경되지 않았습니다. 다시 조회해 주세요."
        );
      }

      setConsent(next);
      setMessage(
        "서비스 동의 설정이 저장되었습니다."
      );
    } catch (err) {
      setError(settingsError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="efx-screen">
        <SettingsHeader title="권한 설정"/>
        <main className="efx-content">
          <SettingsNotice tone="error">
            지원하지 않는 권한입니다.
          </SettingsNotice>
        </main>
      </div>
    );
  }

  return (
    <div className="efx-screen">
      <SettingsHeader
        title={config.title}
        onRefresh={() =>
          setReload((n) => n + 1)
        }
        disabled={saving || checking || loading}
      />

      <main className="efx-content">
        <div className="efx-heading">
          <p className="efx-eyebrow">PERMISSIONS</p>
          <h1>{config.title}을 확인해요</h1>
          <p>{config.intro}</p>
        </div>

        {loading && (
          <SettingsNotice>
            권한 정보를 불러오고 있습니다.
          </SettingsNotice>
        )}

        {error && (
          <SettingsNotice tone="error">
            {error}
          </SettingsNotice>
        )}

        {message && (
          <SettingsNotice tone="success">
            {message}
          </SettingsNotice>
        )}

        <section className="efx-card efx-hero-card">
          <span className="efx-big-icon">
            <SettingsIcon name={config.icon} size={30}/>
          </span>

          <b>{config.usage}</b>
          <p>{config.note}</p>
        </section>

        {/* 기기 권한 */}
        <section className="efx-card">
          <div className="efx-section-head">
            <h2>기기 권한</h2>

            <SettingsBadge
              tone={
                browserState === "granted"
                  ? "success"
                  : browserState === "denied"
                  ? "warning"
                  : "neutral"
              }
            >
              {browserLabels[browserState] ?? "확인 불가"}
            </SettingsBadge>
          </div>

          <p className="efx-muted">
            브라우저·운영체제의 접근 권한입니다.
            앱의 개인정보 이용 동의와 별개로 관리돼요.
          </p>

          <button
            type="button"
            className="efx-outline-button"
            onClick={testPermission}
            disabled={checking || saving}
          >
            {checking
              ? "권한 확인 중..."
              : `${type === "camera" ? "카메라" : "위치"} 권한 확인하기`}
          </button>

          <p className="efx-muted">
            차단 상태에서는 브라우저의 사이트 설정에서
            직접 변경해야 할 수 있습니다.
          </p>
        </section>

        {/* 서버 선택 동의 */}
        <section className="efx-card">
          <div className="efx-section-head">
            <h2>서비스 이용 동의</h2>

            <SettingsBadge
              tone={consent ? "success" : "warning"}
            >
              {consent === null
                ? "확인 중"
                : consent
                ? "동의함"
                : "동의 안 함"}
            </SettingsBadge>
          </div>

          <p className="efx-muted">
            서버에 저장되는 선택 동의입니다.
            철회하면 GPS·사진 인증이 필요한
            서비스 이용이 제한될 수 있습니다.
          </p>

          <button
            type="button"
            className={
              consent
                ? "efx-outline-button"
                : "efx-main-button"
            }
            disabled={loading || saving || consent === null}
            onClick={changeConsent}
          >
            {saving
              ? "저장 중..."
              : consent
              ? "서비스 동의 철회"
              : "서비스 이용 동의"}
          </button>
        </section>

        <Link
          className="efx-link-row"
          to="/profile/consents"
        >
          <SettingsIcon name="shield"/>
          <span>
            <b>개인정보 및 공유 내역</b>
            <small>필수 동의·상담기관 공유 현황</small>
          </span>
          <SettingsIcon name="chevron" size={16}/>
        </Link>
      </main>
    </div>
  );
}
