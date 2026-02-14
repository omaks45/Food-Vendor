/* eslint-disable prettier/prettier */
/**
 * Capitalize first letter of string
 */
export function capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Mask email for privacy
 * example@domain.com -> e***e@d***n.com
 */
export function maskEmail(email: string): string {
    if (!email) return '';
    
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    
    const maskedUsername =
        username.length > 2
        ? username[0] + '***' + username[username.length - 1]
        : '***';
        
    const [domainName, tld] = domain.split('.');
    const maskedDomain =
        domainName.length > 2
        ? domainName[0] + '***' + domainName[domainName.length - 1]
        : '***';
        
    return `${maskedUsername}@${maskedDomain}.${tld}`;
}

/**
 * Mask phone number for privacy
 * +2348012345678 -> +234***5678
 */
export function maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 8) return '***';
    
    const visibleStart = phone.substring(0, 4);
    const visibleEnd = phone.substring(phone.length - 4);
    
    return `${visibleStart}***${visibleEnd}`;
}