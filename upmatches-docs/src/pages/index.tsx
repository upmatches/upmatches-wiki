import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function Home(): ReactNode {
  return (
    <Layout description="Internal documentation for Upmatches">
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          textAlign: 'center',
          padding: '2rem',
        }}>
        <Heading as="h1" style={{fontSize: '3rem'}}>
          Upmatches Documentation
        </Heading>
        <p style={{fontSize: '1.25rem', marginBottom: '2rem'}}>
          Everything you need to build, test, and ship Upmatches.
        </p>
        <Link
          className="button button--primary button--lg"
          to="/docs/modules/new-user-onboarding">
          Get Started
        </Link>
      </header>
    </Layout>
  );
}
