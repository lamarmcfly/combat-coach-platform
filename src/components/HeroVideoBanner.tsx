import { VideoPlayer } from "@/components/video/VideoPlayer";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/buttons/SecondaryButton";

type HeroVideoBannerProps = {
  videoRef?: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export function HeroVideoBanner({ videoRef, title, subtitle, primaryCta, secondaryCta }: HeroVideoBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#2b2c30]">
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
      <VideoPlayer
        videoRef={videoRef ?? process.env.NEXT_PUBLIC_HERO_VIDEO_FALLBACK}
        autoPlay
        muted
        loop
        controls={false}
        className="h-[420px] w-full object-cover"
      />
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 py-10 sm:px-10 md:px-16">
        <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Corner Marketplace</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase text-copy leading-tight">{title}</h1>
        <p className="max-w-2xl text-base text-copy-muted">{subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton label={primaryCta.label} href={primaryCta.href} />
          {secondaryCta ? <SecondaryButton label={secondaryCta.label} href={secondaryCta.href} /> : null}
        </div>
      </div>
    </section>
  );
}
