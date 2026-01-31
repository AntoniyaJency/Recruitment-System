# Recruitment System

A modern, full-stack recruitment platform built with Flask (backend) and HTML/CSS/JavaScript (frontend) with SQL database integration.

## Features

### Frontend
- **Job Search & Filtering**: Search jobs by title, location, category, and type
- **Application System**: Submit job applications with file uploads
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Admin Dashboard**: Manage jobs, applications, and view analytics
- **Modern UI**: Clean, professional interface with smooth animations

### Backend
- **RESTful API**: Complete API for jobs, applications, and companies
- **SQL Database**: SQLAlchemy ORM with SQLite database
- **Data Models**: Jobs, Applications, and Companies with relationships
- **File Upload**: Resume upload handling with validation
- **Error Handling**: Comprehensive error handling and validation

## Project Structure

```
Recruitment-System/
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── database.py            # Database models
├── migrate.py             # Database migration script
├── requirements.txt       # Python dependencies
├── index.html            # Frontend main page
├── admin.html            # Admin dashboard
├── styles.css            # CSS styling
├── script.js             # Frontend JavaScript
├── uploads/              # File upload directory
└── recruitment.db        # SQLite database (auto-generated)
```

## Installation & Setup

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Initialize Database
```bash
# Create database tables
python migrate.py create

# Seed with sample data (optional)
python migrate.py seed

# Or reset everything (drop and recreate)
python migrate.py reset
```

### 3. Run the Application
```bash
python app.py
```

The application will be available at:
- Frontend: http://localhost:5000
- Admin Dashboard: http://localhost:5000/admin
- API Base URL: http://localhost:5000/api

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs (with filtering and pagination)
- `GET /api/jobs/<id>` - Get specific job
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/<id>` - Update job
- `DELETE /api/jobs/<id>` - Delete job

### Applications
- `GET /api/applications` - Get all applications (with filtering)
- `POST /api/applications` - Submit new application
- `PUT /api/applications/<id>` - Update application status
- `DELETE /api/applications/<id>` - Delete application

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database Schema

### Jobs Table
- `id` - Primary key
- `title` - Job title
- `company` - Company name
- `location` - Job location
- `job_type` - full-time, part-time, remote, contract
- `category` - Job category
- `salary` - Salary range
- `description` - Job description
- `tags` - Comma-separated skill tags
- `status` - active/inactive
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Applications Table
- `id` - Primary key
- `job_id` - Foreign key to jobs table
- `applicant_name` - Applicant's full name
- `applicant_email` - Applicant's email
- `applicant_phone` - Applicant's phone number
- `cover_letter` - Cover letter text
- `resume_filename` - Uploaded resume filename
- `status` - pending, reviewed, accepted, rejected
- `applied_at` - Application timestamp
- `updated_at` - Last update timestamp

### Companies Table
- `id` - Primary key
- `name` - Company name (unique)
- `description` - Company description
- `website` - Company website
- `location` - Company location
- `industry` - Industry sector
- `size` - Company size (Small, Medium, Large)
- `logo_url` - Company logo URL
- `created_at` - Creation timestamp

## Usage Examples

### Search Jobs
```javascript
// Search jobs with filters
fetch('/api/jobs?category=technology&type=remote&search=react')
  .then(response => response.json())
  .then(data => console.log(data.jobs));
```

### Submit Application
```javascript
const applicationData = {
  job_id: 1,
  applicant_name: "John Doe",
  applicant_email: "john@example.com",
  applicant_phone: "555-1234",
  cover_letter: "I am interested in this position...",
  resume_filename: "resume.pdf"
};

fetch('/api/applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(applicationData)
});
```

### Update Application Status
```javascript
fetch('/api/applications/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'reviewed' })
});
```

## Configuration

The application uses environment variables for configuration:

- `SECRET_KEY` - Flask secret key (auto-generated in development)
- `DATABASE_URL` - Database connection string (defaults to SQLite)
- `FLASK_ENV` - Environment (development/production)

## File Uploads

- Resume files are stored in the `uploads/` directory
- Maximum file size: 16MB
- Allowed formats: PDF, DOC, DOCX
- File validation included

## Development

### Running in Development Mode
```bash
export FLASK_ENV=development
python app.py
```

### Database Migrations
```bash
# Create new tables
python migrate.py create

# Add sample data
python migrate.py seed

# Reset database
python migrate.py reset
```

## Production Deployment

For production deployment:

1. Set environment variables:
   ```bash
   export SECRET_KEY='your-production-secret-key'
   export DATABASE_URL='your-production-database-url'
   export FLASK_ENV=production
   ```

2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. Configure a reverse proxy (nginx/Apache) for SSL and static file serving

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.