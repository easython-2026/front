
import { useCallback, useEffect, useRef, useState } from "react";

function getLocationErrorMessage(error) {
  switch (error?.code) {
    case 1:
      return "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해 주세요.";

    case 2:
      return "현재 위치를 확인할 수 없습니다. GPS 또는 네트워크 상태를 확인해 주세요.";

    case 3:
      return "위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.";

    default:
      return "위치 정보를 가져오는 중 문제가 발생했습니다.";
  }
}

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const getCurrentLocation = useCallback(() => {
    const requestId = ++requestIdRef.current;

    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      const message =
        "이 브라우저에서는 GPS 위치 기능을 지원하지 않습니다.";

      setError(message);
      setLoading(false);

      return Promise.reject(new Error(message));
    }

    setLoading(true);
    setError("");
    setLocation(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          if (
            mountedRef.current &&
            requestId === requestIdRef.current
          ) {
            setLocation(result);
            setLoading(false);
          }

          resolve(result);
        },

        (geoError) => {
          const message =
            getLocationErrorMessage(geoError);

          if (
            mountedRef.current &&
            requestId === requestIdRef.current
          ) {
            setError(message);
            setLoading(false);
          }

          reject(new Error(message));
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const resetLocation = useCallback(() => {
    requestIdRef.current += 1;
    setLocation(null);
    setLoading(false);
    setError("");
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    resetLocation,
  };
}
