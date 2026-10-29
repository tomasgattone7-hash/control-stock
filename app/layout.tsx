import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Zarpado Mueble · Stock de fábrica',description:'Inventario compartido de la fábrica. Entradas, salidas y reposición.',robots:{index:false,follow:false},icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
