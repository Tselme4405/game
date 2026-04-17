"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { isDeliveryCredentials } from "@/lib/guards";
import { setSession } from "@/lib/storage";
import { Manrope } from "next/font/google";
import styles from "./page.module.css";

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
      <section className={styles.hero}>
        <Image
          className={styles.heroImage}
          src="/hero-piroshki-table.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />

        <header className={styles.topbar}>
          <div className={styles.brand}>
            <span>Pinecone Delivery</span>
          </div>

          <div className={styles.topbarActions}>
            <a href="#auth-form" className={styles.topbarButton}>
              Захиалах
            </a>
          </div>
        </header>

        <div className={styles.heroShell}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroHeadline}>
              Ангидаа пирошки захиалаарай
            </h1>

            <p className={styles.heroBody}>
              Ангиа сонгоод нэрээ бичээд шууд цэс рүү орно.
            </p>

            <div className={styles.authWrap}>
              <AuthForm onSubmit={handleAuthSubmit} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
