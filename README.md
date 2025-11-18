# UNN Shuttle Booking System Landing Page

A modern, responsive landing page for the University of Nigeria, Nsukka (UNN) Shuttle Booking System. This website provides an intuitive interface for students to book shuttle rides across campus with real-time tracking and secure payments.

## 🚀 Features

- **Modern Design**: Clean, professional interface with gradient backgrounds and smooth animations
- **Responsive Layout**: Fully optimized for desktop, tablet, and mobile devices
- **Interactive Elements**: 
  - Smooth scrolling navigation
  - Mobile-friendly hamburger menu
  - Booking modal with form validation
  - Animated counters and hover effects
  - Ripple effects on buttons
- **Real-time Features**: Simulated booking system with notifications
- **Accessibility**: Semantic HTML5 structure with proper ARIA labels

## 🛠️ Technologies Used

- **HTML5**: Semantic markup for better SEO and accessibility
- **TailwindCSS**: Utility-first CSS framework for rapid styling
- **Vanilla JavaScript**: No dependencies, pure JavaScript for interactions
- **Font Awesome**: Icon library for beautiful UI elements
- **Unsplash Images**: High-quality placeholder images

## 📁 Project Structure

```
MAIN/
├── index.html          # Main landing page
├── script.js           # Interactive JavaScript functionality
├── README.md           # Project documentation
└── assets/             # Images and static assets (if needed)
```

## 🚀 Quick Start

1. **Clone or download** the project files to your local machine
2. **Open `index.html`** in your preferred web browser
3. **No installation required** - everything runs directly in the browser!

### For Development

If you want to make modifications:

1. Use any code editor (VS Code, Sublime Text, etc.)
2. Use Live Server extension for auto-reloading during development
3. Modify `index.html` for structure changes
4. Update `script.js` for interactive features
5. Adjust styles in the `<style>` section of `index.html` or use Tailwind classes

## 🎨 Customization Guide

### Changing Colors
Update the CSS variables in the `<style>` section of `index.html`:

```css
.gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Modifying Content
- Edit text content directly in `index.html`
- Update navigation links and sections
- Change images by updating `src` attributes
- Modify contact information in the footer

### Adding New Sections
1. Add new `<section>` elements to `index.html`
2. Update navigation menu with new links
3. Add corresponding JavaScript functionality if needed

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

The design uses Tailwind's responsive utilities:
- `sm:` for small screens (640px+)
- `md:` for medium screens (768px+)
- `lg:` for large screens (1024px+)
- `xl:` for extra large screens (1280px+)

## 🔧 Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 🎯 Interactive Features

### Booking System
- Click "Book Now" to open the booking modal
- Select pickup/drop-off locations
- Choose preferred time and number of passengers
- Receive confirmation notification

### Navigation
- Smooth scrolling to sections
- Mobile-responsive hamburger menu
- Active state indicators

### Animations
- Floating hero image
- Scroll-triggered animations
- Counter animations for statistics
- Hover effects on cards and buttons

## 📈 Performance Optimization

- **Optimized Images**: Uses compressed placeholder images
- **Minimal Dependencies**: Only loads necessary CDN resources
- **Efficient CSS**: Uses Tailwind's utility classes for minimal CSS
- **Lazy Loading Ready**: Structure supports easy implementation of lazy loading

## 🔒 Security Considerations

- No server-side processing required
- All interactions are client-side only
- Form validation implemented in JavaScript
- Ready for integration with secure backend API

## 🌐 Deployment

### Static Hosting Options
- **Netlify**: Drag and drop deployment
- **Vercel**: Zero-config deployment
- **GitHub Pages**: Free hosting from repository
- **Firebase Hosting**: Google's hosting solution
- **Any static web server**: Upload files directly

### Deployment Steps
1. Upload all files to your hosting provider
2. Ensure `index.html` is the default page
3. Test all links and interactive features
4. Configure domain if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or support:
- Email: info@unnshuttle.com
- Phone: +234 800 123 4567
- Location: UNN Campus, Enugu

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for UNN Students**
