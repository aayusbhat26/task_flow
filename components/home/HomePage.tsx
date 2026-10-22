import { CreativeHeader } from "./header/CreativeHeader";
import { Nav } from "./nav/Nav";
import { Footer } from "./footer/Footer";
import { LandingSections } from "./landing/LandingSections";

export const HomePage = () => {
  return (
    <>
      <Nav />
      <CreativeHeader />
      <LandingSections />
      <Footer />
    </>
  );
};
