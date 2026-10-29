export function stockLevel(p:{quantity:number;minimum:number;warning:number}) { return p.quantity < p.minimum ? 'critical' : p.quantity <= p.warning ? 'warning' : 'ok'; }
export const categories=['Pistones','Bisagras','Guías','Apertura','Patas y regatones','Electricidad','Placas','Cantos','Tornillos','Otros'];
