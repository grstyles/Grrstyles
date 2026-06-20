import { Truck, RotateCcw, Gem, ShieldCheck, Gift } from "lucide-react";
import styles from "./WhyChooseUs.module.css";

export default function WhyChooseUs() {
  const features = [
    {
      icon: <Truck size={32} strokeWidth={1.5} />,
      title: "Free Shipping",
      desc: "On all orders over ₹200",
    },
    {
      icon: <RotateCcw size={32} strokeWidth={1.5} />,
      title: "Easy Returns",
      desc: "30-day return policy",
    },
    {
      icon: <Gem size={32} strokeWidth={1.5} />,
      title: "Premium Quality",
      desc: "Crafted to perfection",
    },
    {
      icon: <ShieldCheck size={32} strokeWidth={1.5} />,
      title: "Secure Payments",
      desc: "100% secure checkout",
    },
    {
      icon: <Gift size={32} strokeWidth={1.5} />,
      title: "Exclusive Offers",
      desc: "For our members",
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {features.map((feature, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.iconWrapper}>{feature.icon}</div>
            <h3 className={styles.title}>{feature.title}</h3>
            <p className={styles.desc}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
