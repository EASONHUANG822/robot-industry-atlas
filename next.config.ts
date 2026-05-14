import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
