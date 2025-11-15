import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export function generatePDF(outputPath) {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Header
  doc.fontSize(24).fillColor('#2563eb').text(config.companyName, { align: 'center' });
  doc.fontSize(16).fillColor('#64748b').text(config.companyTagline, { align: 'center' });
  doc.moveDown(2);

  // Title
  doc.fontSize(20).fillColor('#0f172a').text('Enterprise Architecture & Infrastructure Guide', { align: 'center' });
  doc.moveDown();

  // Introduction
  doc.fontSize(12).fillColor('#1e293b').text(
    `This comprehensive guide outlines best practices for enterprise software architecture, infrastructure design, and scalable system deployments. ${config.companyName} provides ready-made server configurations, infrastructure setup services, and consulting solutions to help organizations build robust, maintainable systems.`,
    { align: 'justify' }
  );
  doc.moveDown();

  // Section 1
  doc.fontSize(16).fillColor('#2563eb').text('1. Enterprise Architecture Patterns', { underline: true });
  doc.fontSize(12).fillColor('#1e293b').text(
    'Modern enterprise systems require well-defined architectural patterns. Microservices architecture enables independent scaling and deployment of system components. Event-driven architectures facilitate real-time data processing and system responsiveness. API-first design ensures seamless integration with third-party services and client applications. Container orchestration with Kubernetes provides automated scaling, service discovery, and load balancing for distributed systems.',
    { align: 'justify' }
  );
  doc.moveDown();

  // Section 2
  doc.fontSize(16).fillColor('#2563eb').text('2. Infrastructure as Code & Automation', { underline: true });
  doc.fontSize(12).fillColor('#1e293b').text(
    'Infrastructure as Code (IaC) enables version-controlled, repeatable infrastructure deployments. Tools like Terraform and Ansible allow teams to define server configurations, network topologies, and deployment pipelines declaratively. Automated CI/CD pipelines reduce deployment errors and enable rapid iteration. Infrastructure monitoring and alerting systems provide real-time visibility into system health and performance metrics.',
    { align: 'justify' }
  );
  doc.moveDown();

  // Section 3
  doc.fontSize(16).fillColor('#2563eb').text('3. Scalability & Performance Optimization', { underline: true });
  doc.fontSize(12).fillColor('#1e293b').text(
    'Horizontal scaling strategies allow systems to handle increasing loads by adding more server instances. Database optimization techniques including indexing, query optimization, and read replicas improve application performance. Caching layers using Redis or Memcached reduce database load and improve response times. Content Delivery Networks (CDNs) distribute static assets globally for faster content delivery. Load balancing distributes traffic across multiple servers to prevent bottlenecks.',
    { align: 'justify' }
  );
  doc.moveDown();

  // Section 4
  doc.fontSize(16).fillColor('#2563eb').text('4. Security & Compliance', { underline: true });
  doc.fontSize(12).fillColor('#1e293b').text(
    'Security must be integrated into every layer of the architecture. Zero-trust network models assume no implicit trust and verify every access request. Encryption at rest and in transit protects sensitive data. Regular security audits and penetration testing identify vulnerabilities before they can be exploited. Compliance with industry standards (SOC 2, ISO 27001, GDPR) ensures data protection and regulatory adherence. Identity and access management (IAM) systems control user permissions and authentication.',
    { align: 'justify' }
  );
  doc.moveDown();

  // Section 5
  doc.fontSize(16).fillColor('#2563eb').text('5. Cloud Infrastructure & Hybrid Deployments', { underline: true });
  doc.fontSize(12).fillColor('#1e293b').text(
    'Cloud-native architectures leverage managed services for databases, message queues, and storage. Multi-cloud strategies reduce vendor lock-in and improve disaster recovery capabilities. Hybrid deployments combine on-premises infrastructure with cloud services for optimal cost and performance. Serverless computing models reduce operational overhead for event-driven workloads. Container platforms like Docker and Kubernetes provide consistent deployment environments across development, staging, and production.',
    { align: 'justify' }
  );
  doc.moveDown();

  // Section 6
  doc.fontSize(16).fillColor('#2563eb').text('6. Monitoring, Observability & DevOps', { underline: true });
  doc.fontSize(12).fillColor('#1e293b').text(
    'Comprehensive monitoring provides visibility into system performance, errors, and user behavior. Distributed tracing helps identify bottlenecks in microservices architectures. Log aggregation and analysis enable rapid troubleshooting and incident response. Application Performance Monitoring (APM) tools track response times, error rates, and resource utilization. DevOps practices bridge development and operations teams, enabling faster delivery cycles and improved system reliability.',
    { align: 'justify' }
  );
  doc.moveDown();

  // Footer
  doc.moveDown();
  doc.fontSize(10).fillColor('#64748b').text(`${config.companyName} - ${config.companyTagline}`, { align: 'center' });
  doc.text(`${config.companyWebsite} | ${config.companyEmail}`, { align: 'center' });
  doc.text('Generated: ' + new Date().toISOString().split('T')[0], { align: 'center' });
  doc.text('Confidential - For Client Use Only', { align: 'center', font: 'Helvetica-Bold' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}
