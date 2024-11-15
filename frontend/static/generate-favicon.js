// You can run this once to generate the PNG favicon
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');

// Draw background
ctx.fillStyle = '#4CAF50';
ctx.beginPath();
ctx.roundRect(0, 0, 32, 32, 6);
ctx.fill();

// Draw text
ctx.fillStyle = 'white';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('T', 16, 16);

// Save as PNG
const link = document.createElement('a');
link.download = 'favicon.png';
link.href = canvas.toDataURL('image/png');
link.click();