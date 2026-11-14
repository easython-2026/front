
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

const EMPTY_WORKPLACE = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radiusMeters: "",
};

const EMPTY_BUSINESS = {
  name: "",
  address: "",
  ownerName: "",
};

function unwrap(response) {
  return response?.data ?? response;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  if (error?.status === 400) {
    return "입력한 주소, 좌표 또는 필수 항목을 확인해 주세요.";
  }

  return error?.message ?? "저장에 실패했습니다.";
}

function toWorkplaceForm(value) {
  return {
    name: value?.name ?? "",
    address: value?.address ?? "",
    latitude: value?.latitude == null
      ? ""
      : String(value.latitude),
    longitude: value?.longitude == null
      ? ""
      : String(value.longitude),
    radiusMeters: value?.radiusMeters == null
      ? ""
      : String(value.radiusMeters),
  };
}

function toBusinessForm(value) {
  return {
    name: value?.name ?? "",
    address: value?.address ?? "",
    ownerName: value?.ownerName ?? "",
  };
}

function validateWorkplace(form) {
  const name = form.name.trim();
  const address = form.address.trim();

  if (!name || !address) {
    throw new Error("근무장소명과 주소를 입력해 주세요.");
  }

  if (
    form.latitude.trim() === "" ||
    form.longitude.trim() === ""
  ) {
    throw new Error("위도와 경도를 모두 입력해 주세요.");
  }

  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error("위도는 -90에서 90 사이여야 합니다.");
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("경도는 -180에서 180 사이여야 합니다.");
  }

  const result = {
    name,
    address,
    latitude,
    longitude,
  };

  if (form.radiusMeters.trim() !== "") {
    const radius = Number(form.radiusMeters);

    if (
      !Number.isSafeInteger(radius) ||
      radius <= 0
    ) {
      throw new Error("허용 반경은 1 이상의 정수여야 합니다.");
    }

    result.radiusMeters = radius;
  }

  return result;
}

function validateBusiness(form) {
  const name = form.name.trim();
  const address = form.address.trim();
  const ownerName = form.ownerName.trim();

  if (!name || !address || !ownerName) {
    throw new Error(
      "사업장명, 사업장 주소, 대표자명을 모두 입력해 주세요."
    );
  }

  return { name, address, ownerName };
}

export default function Workplace() {
  const [serverData, setServerData] = useState(null);

  const [workplace, setWorkplace] =
    useState(EMPTY_WORKPLACE);

  const [business, setBusiness] =
    useState(EMPTY_BUSINESS);

  const [loading, setLoading] = useState(true);
  const [savingWorkplace, setSavingWorkplace] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        const response = await apiRequest(
          "accountSettings",
          "getWorkplace",
          { signal: controller.signal }
        );

        if (!active) return;

        const data = unwrap(response);

        if (!data || typeof data !== "object") {
          throw new Error(
            "근무장소 조회 응답 형식이 올바르지 않습니다."
          );
        }

        setServerData(data);
        setWorkplace(toWorkplaceForm(data.workplace));
        setBusiness(toBusinessForm(data.business));

        setError("");
      } catch (err) {
        if (!active || err?.name === "AbortError") return;
        setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  function refresh() {
    setLoading(true);
    setMessage("");
    setReloadKey((previous) => previous + 1);
  }

  function changeWorkplace(key, value) {
    setWorkplace((previous) => ({
      ...previous,
      [key]: value,
    }));
    setMessage("");
  }

  function changeBusiness(key, value) {
    setBusiness((previous) => ({
      ...previous,
      [key]: value,
    }));
    setMessage("");
  }

  async function saveData(body, successMessage) {
    const response = await apiRequest(
      "accountSettings",
      "saveWorkplace",
      { body }
    );

    const data = unwrap(response);

    // 서버 응답으로 화면 동기화
    if (!data || typeof data !== "object") {
      throw new Error("저장 응답을 확인할 수 없습니다.");
    }

    setServerData(data);
    setWorkplace(toWorkplaceForm(data.workplace));
    setBusiness(toBusinessForm(data.business));
    setMessage(successMessage);
  }

  async function handleSaveWorkplace(event) {
    event.preventDefault();

    if (loading || savingWorkplace || savingBusiness) return;

    let payload;

    try {
      payload = validateWorkplace(workplace);
    } catch (err) {
      setError(getErrorMessage(err));
      return;
    }

    setSavingWorkplace(true);
    setError("");
    setMessage("");

    try {
      // 전체 교체 대상 workplace의 필수 필드를 모두 전송
      await saveData(
        { workplace: payload },
        "근무장소 정보가 저장되었습니다."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingWorkplace(false);
    }
  }

  async function handleSaveBusiness(event) {
    event.preventDefault();

    if (loading || savingWorkplace || savingBusiness) return;

    let payload;

    try {
      payload = validateBusiness(business);
    } catch (err) {
      setError(getErrorMessage(err));
      return;
    }

    setSavingBusiness(true);
    setError("");
    setMessage("");

    try {
      // business만 변경할 때 workplace는 전송하지 않는다.
      await saveData(
        { business: payload },
        "사업장 정보가 저장되었습니다."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingBusiness(false);
    }
  }

  const busy = loading || savingWorkplace || savingBusiness;

  const savedWorkplace = serverData?.workplace;
  const savedBusiness = serverData?.business;

  return (
    <main style={{
      maxWidth: 720,
      margin: "0 auto",
      padding: 24,
    }}>
      <h1>근무장소 및 사업장 관리</h1>

      <p>
        근무장소는 GPS 출퇴근 인증에 사용되고,
        사업장 정보는 진정서 작성에 사용됩니다.
      </p>

      {loading && (
        <p role="status">
          근무장소 정보를 불러오는 중...
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {!loading && serverData && (
        <>
          <section style={{ marginTop: 28 }}>
            <h2>1. 근무장소 정보</h2>

            <p>
              등록 상태:{" "}
              {savedWorkplace
                ? "등록됨"
                : "미등록"}
            </p>

            <p>
              출퇴근 GPS 인증 기준이 되는 실제 장소를
              입력해 주세요.
            </p>

            <form onSubmit={handleSaveWorkplace}>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="workplace-name">
                  근무장소명
                </label>
                <input
                  id="workplace-name"
                  value={workplace.name}
                  onChange={(event) =>
                    changeWorkplace("name", event.target.value)
                  }
                  disabled={busy}
                  required
                  style={{ display: "block", width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="workplace-address">
                  근무장소 주소
                </label>
                <input
                  id="workplace-address"
                  value={workplace.address}
                  onChange={(event) =>
                    changeWorkplace("address", event.target.value)
                  }
                  disabled={busy}
                  required
                  style={{ display: "block", width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="workplace-latitude">
                  위도 (latitude)
                </label>
                <input
                  id="workplace-latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={workplace.latitude}
                  onChange={(event) =>
                    changeWorkplace("latitude", event.target.value)
                  }
                  disabled={busy}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="workplace-longitude">
                  경도 (longitude)
                </label>
                <input
                  id="workplace-longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={workplace.longitude}
                  onChange={(event) =>
                    changeWorkplace("longitude", event.target.value)
                  }
                  disabled={busy}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="workplace-radius">
                  허용 반경 (미터, 선택)
                </label>
                <input
                  id="workplace-radius"
                  type="number"
                  min="1"
                  step="1"
                  value={workplace.radiusMeters}
                  onChange={(event) =>
                    changeWorkplace(
                      "radiusMeters",
                      event.target.value
                    )
                  }
                  disabled={busy}
                />
                <p>
                  비워두면 서버 기본값을 사용합니다.
                  기존 허용 반경을 변경하려면 새 값을 입력하세요.
                </p>
              </div>

              <p>
                주소를 입력했다고 위도와 경도가 자동
                확인되는 것은 아닙니다. 실제 근무장소의
                좌표를 확인하고 등록해야 합니다.
              </p>

              <button
                type="submit"
                disabled={busy}
              >
                {savingWorkplace
                  ? "근무장소 저장 중..."
                  : "근무장소 저장"}
              </button>
            </form>
          </section>

          <hr style={{ margin: "32px 0" }} />

          <section>
            <h2>2. 사업장 정보</h2>

            <p>
              등록 상태:{" "}
              {savedBusiness
                ? "등록됨"
                : "미등록"}
            </p>

            <p>
              진정서 작성에 필요한 사업장 정보입니다.
              근무장소와 주소가 다를 수 있으므로
              별도로 확인해 주세요.
            </p>

            <form onSubmit={handleSaveBusiness}>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="business-name">
                  사업장명
                </label>
                <input
                  id="business-name"
                  value={business.name}
                  onChange={(event) =>
                    changeBusiness("name", event.target.value)
                  }
                  disabled={busy}
                  required
                  style={{ display: "block", width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="business-address">
                  사업장 주소
                </label>
                <input
                  id="business-address"
                  value={business.address}
                  onChange={(event) =>
                    changeBusiness("address", event.target.value)
                  }
                  disabled={busy}
                  required
                  style={{ display: "block", width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="business-owner">
                  대표자명
                </label>
                <input
                  id="business-owner"
                  value={business.ownerName}
                  onChange={(event) =>
                    changeBusiness("ownerName", event.target.value)
                  }
                  disabled={busy}
                  required
                  style={{ display: "block", width: "100%" }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
              >
                {savingBusiness
                  ? "사업장 저장 중..."
                  : "사업장 정보 저장"}
              </button>
            </form>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>3. 관련 기능</h2>

            <p>
              <Link to="/attendance">
                출퇴근 기록하기
              </Link>
            </p>

            <p>
              <Link to="/petitions">
                진정서 관리
              </Link>
            </p>

            <p>
              <Link to="/profile/consents">
                위치·카메라 동의 확인
              </Link>
            </p>
          </section>

          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            style={{ marginTop: 24 }}
          >
            저장된 정보 새로고침
          </button>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/profile">
          내 정보로 돌아가기
        </Link>
      </p>
    </main>
  );
}
