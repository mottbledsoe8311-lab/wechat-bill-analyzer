import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

const pdfPath = '/home/ubuntu/test_bill.pdf';
const pdfBuffer = fs.readFileSync(pdfPath);

console.log('PDF文件大小:', pdfBuffer.length, 'bytes');
console.log('✓ 测试PDF已准备好');
