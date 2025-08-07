// src/app/services/[slug]/page.js (Server Component)
import { notFound } from 'next/navigation';
import services from '../../../data/services';
import ServiceDetailClient from './ServiceDetailClient';

export async function generateStaticParams() {
  return services.map(service => ({ slug: service.slug }));
}

export async function generateMetadata({ params }) {
  const service = services.find(s => s.slug === params.slug);
  if (!service) return { title: 'Service Not Found' };

  return {
    title: service.title,
    description: service.metaDescription || service.description,
  };
}

export default function ServiceDetail({ params }) {
  const service = services.find(s => s.slug === params.slug);

  if (!service) notFound();

  return <ServiceDetailClient service={service} />;
}