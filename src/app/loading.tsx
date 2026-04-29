import Image from "next/image";
import institutoLogo from "@/app/images/logo_instituto_transparente.png";

export default function Loading() {
  return (
    <>
      <div className="nav-feedback-bar nav-feedback-bar--visible" aria-hidden="true" />

      <div
        className="nav-feedback-chip nav-feedback-chip--visible"
        role="status"
        aria-live="polite"
        aria-label="Cargando pantalla"
      >
        <span className="nav-feedback-chip__ring" aria-hidden="true">
          <span className="nav-feedback-chip__ring-inner">
            <Image
              src={institutoLogo}
              alt="IES El Grao"
              className="nav-feedback-chip__logo"
              priority
            />
          </span>
        </span>
        <span className="nav-feedback-chip__text">Cargando</span>
      </div>
    </>
  );
}
