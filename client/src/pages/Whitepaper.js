import React from 'react';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
    >
      {title}
    </motion.h2>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="prose prose-invert prose-indigo max-w-none"
    >
      {children}
    </motion.div>
  </section>
);

const Whitepaper = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6"
        >
          Victim DAO: Decentralized Recovery Protocol — Whitepaper
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-lg text-gray-700 mb-10"
        >
          This document outlines the goals, architecture, and governance of Victim DAO — a community-driven protocol that verifies scam victims, issues on-chain proof-of-loss tokens, and funds partial compensation through transparent voting.
        </motion.p>

        <Section title="1. Problem Statement">
          <p>
            Web3 users have collectively lost billions to scams and rug pulls. Victims lack accessible verification, standardized documentation of losses, and trustworthy community compensation mechanisms. Traditional remedies are slow or unavailable. This undermines trust and adoption in decentralized ecosystems.
          </p>
        </Section>

        <Section title="2. Objectives">
          <ul>
            <li>Verify victims through a structured submission and review flow.</li>
            <li>Issue non-transferable Proof-of-Loss (PoL) tokens as on-chain attestations.</li>
            <li>Allocate compensation pools via transparent voting rounds.</li>
            <li>Preserve privacy-sensitive artifacts off-chain while anchoring claims on-chain.</li>
            <li>Deliver auditable dashboards for contributions, voting outcomes, and distributions.</li>
          </ul>
        </Section>

        <Section title="3. System Architecture">
          <p>
            Victim DAO is a full-stack dApp with a React frontend, Node/Express backend, and a blockchain layer for PoL token issuance and immutable governance records.
          </p>
          <ul>
            <li><strong>Frontend:</strong> Registration, contribution, ranking, and voting UIs with animated, informative visuals.</li>
            <li><strong>Backend:</strong> REST APIs for user auth, submissions, contribution tracking, and round management.</li>
            <li><strong>Storage:</strong> Receipts and evidence artifacts stored off-chain (encrypted), with hashes anchored on-chain.</li>
            <li><strong>On-chain:</strong> PoL token (soulbound/NFT-like) and governance records for vote counts and allocation outcomes.</li>
          </ul>
        </Section>

        <Section title="4. Proof-of-Loss Token (PoL)">
          <p>
            The PoL token is a non-transferable on-chain attestation bound to a verified victim wallet. It encodes a hash of the verified claim and optional metadata (loss amount band, submission date). Transfer is disabled to prevent market speculation; revocation or amendment proposals are handled via governance.
          </p>
        </Section>

        <Section title="5. Governance and Voting">
          <ul>
            <li><strong>Eligibility:</strong> Contributors with minimum stake or verified community members.</li>
            <li><strong>Rounds:</strong> Periodic, themed by cohort (e.g., protocol X, incident window).</li>
            <li><strong>Mechanics:</strong> Weighted votes (stake + reputation) with anti-sybil controls; results immutably recorded.</li>
            <li><strong>Transparency:</strong> All proposals, vote tallies, and allocation formulas are public and auditable.</li>
          </ul>
        </Section>

        <Section title="6. Compensation Pools">
          <p>
            Donations and contributions form pools for partial compensation. Allocation targets prioritize verified victims with higher need scores and community-approved criteria. Disbursements are rate-limited and tracked on-chain, with off-chain confirmations for fiat or centralized exchanges when applicable.
          </p>
        </Section>

        <Section title="7. Security and Compliance">
          <ul>
            <li>Evidence hashing and checksum validation.</li>
            <li>Privacy-preserving workflows and controlled artifact access.</li>
            <li>Abuse mitigation: rate limits, challenge processes, and revocation proposals.</li>
            <li>Legal review for donation compliance and cross-border remittances.</li>
          </ul>
        </Section>

        <Section title="8. Roadmap">
          <ul>
            <li>MVP: verification flow, PoL issuance, basic voting and distribution.</li>
            <li>Phase 2: reputation-weighted governance, analytics dashboards, multi-chain support.</li>
            <li>Phase 3: partnerships, oracle integrations, expanded compensation channels.</li>
          </ul>
        </Section>

        <Section title="9. Economics and Sustainability">
          <p>
            The protocol sustains operations via transparent funding streams: donations, optional platform fees capped by community vote, and grants. All balances and flows are reported with verifiable metrics to maintain accountability.
          </p>
        </Section>

        <Section title="10. Conclusion">
          <p>
            Victim DAO restores trust in Web3 by standardizing verification, memorializing loss on-chain, and mobilizing community resources for recovery — all governed transparently.
          </p>
        </Section>
      </div>
    </div>
  );
};

export default Whitepaper;