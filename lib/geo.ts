export async function getIpLocation(ip: string): Promise<string> {
  if (!ip || ip === 'Unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'محلي (Local)';
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=ar`, {
      next: { revalidate: 3600 } 
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      return `${data.country} - ${data.city}`;
    }
  } catch (error) {
    console.error('Failed to fetch IP location:', error);
  }
  
  return 'غير معروف';
}
