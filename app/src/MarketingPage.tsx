import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import AppTheme from './shared-theme/AppTheme';
import AppAppBar from './components/MarketingPageComponents/AppAppBar';
import Hero from './components/MarketingPageComponents/Hero';
import LogoCollection from './components/MarketingPageComponents/LogoCollection';
import Highlights from './components/MarketingPageComponents/Highlights';
import Features from './components/MarketingPageComponents/Features';
import Testimonials from './components/MarketingPageComponents/Testimonials';
import FAQ from './components/MarketingPageComponents/FAQ';
import Footer from './components/MarketingPageComponents/Footer';

export default function MarketingPage(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <AppAppBar />
      <Hero />
      <div>
        <LogoCollection />
        <Features />
        <Divider />
        <Testimonials />
        <Divider />
        <Highlights />
        <Divider />
        <Divider />
        <FAQ />
        <Divider />
        <Footer />
      </div>
    </AppTheme>
  );
}