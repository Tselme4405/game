"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { isDeliveryCredentials } from "@/lib/guards";
import { setSession } from "@/lib/storage";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import styles from "./page.module.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function HomePage() {
  const router = useRouter();

  async function saveUserToDb(input: {
    name: string;
    classNumber: string;
    role: "student" | "teacher";
  }) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        class_number: input.classNumber ?? null,
        role: input.role,
      }),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || "Мэдээлэл хадгалж чадсангүй");
    }
  }

  async function handleAuthSubmit(session: {
    name: string;
    classNumber: string;
  }) {
    if (isDeliveryCredentials(session.name, session.classNumber)) {
      setSession({
        role: "teacher",
        name: session.name,
        classNumber: session.classNumber,
      });
      router.push("/delivery");
      return;
    }

    await saveUserToDb({
      name: session.name,
      classNumber: session.classNumber,
      role: "student",
    });

    setSession({
      ...session,
      role: "student",
    });

    router.push("/select");
  }

  return (
    <main className={`${styles.page} ${bodyFont.className}`}>
      <Script src="/agency-landing.js" strategy="afterInteractive" />

      <section className={styles.hero}>
        <video
          className={styles.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="https://images.pexels.com/videos/3129957/free-video-3129957.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1920"
        >
          <source
            src="https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"
            type="video/mp4"
          />
        </video>

        <div className={styles.heroGlow} />

        <div className={styles.heroShell}>
          <div className={styles.heroContent}>
            <div className={styles.brandBadge} data-reveal>
              <span className={styles.wordmarkDot} />
              <span>Pinecone Delivery</span>
            </div>

            <p className={styles.kicker} data-reveal>
              Pinecone-д зориулсан
            </p>

            <h1
              className={`${styles.heroTitle} ${displayFont.className}`}
              data-reveal
            >
              Пирошки хүргэлтийн website
            </h1>

            <p className={styles.heroBody} data-reveal>
              Сурагчид захиалгаа хурдан өгч, багш нар хүргэлтээ нэг дэлгэцээс
              хянах хялбар, ойлгомжтой систем.
            </p>
          </div>

          <div className={styles.accessDock} data-reveal>
            <div className={styles.accessHeader}>
              <p className={styles.sectionEyebrow}>Нэвтрэх</p>
              <h2 className={styles.accessTitle}>
                Нэр, ангиа оруулаад нэвтэрнэ үү
              </h2>
            </div>

            <div className={styles.authWrap}>
              <AuthForm onSubmit={handleAuthSubmit} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
