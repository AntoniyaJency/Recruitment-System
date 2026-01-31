from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///recruitment.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

db = SQLAlchemy(app)

# Models
class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    job_type = db.Column(db.String(50), nullable=False)  # full-time, part-time, remote, contract
    category = db.Column(db.String(100), nullable=False)
    salary = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    tags = db.Column(db.String(500))  # Comma-separated tags
    status = db.Column(db.String(20), default='active')  # active, inactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with applications
    applications = db.relationship('Application', backref='job', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'job_type': self.job_type,
            'category': self.category,
            'salary': self.salary,
            'description': self.description,
            'tags': self.tags.split(',') if self.tags else [],
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'application_count': len(self.applications)
        }

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    applicant_name = db.Column(db.String(200), nullable=False)
    applicant_email = db.Column(db.String(200), nullable=False)
    applicant_phone = db.Column(db.String(50), nullable=False)
    cover_letter = db.Column(db.Text, nullable=False)
    resume_filename = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, reviewed, accepted, rejected
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else None,
            'company': self.job.company if self.job else None,
            'applicant_name': self.applicant_name,
            'applicant_email': self.applicant_email,
            'applicant_phone': self.applicant_phone,
            'cover_letter': self.cover_letter,
            'resume_filename': self.resume_filename,
            'status': self.status,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    description = db.Column(db.Text)
    website = db.Column(db.String(500))
    location = db.Column(db.String(200))
    industry = db.Column(db.String(100))
    size = db.Column(db.String(50))  # Small, Medium, Large
    logo_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'website': self.website,
            'location': self.location,
            'industry': self.industry,
            'size': self.size,
            'logo_url': self.logo_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

# API Routes for Jobs
@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category')
        job_type = request.args.get('type')
        search = request.args.get('search')
        location = request.args.get('location')
        
        query = Job.query.filter_by(status='active')
        
        if category:
            query = query.filter_by(category=category)
        if job_type:
            query = query.filter_by(job_type=job_type)
        if search:
            query = query.filter(
                db.or_(
                    Job.title.contains(search),
                    Job.company.contains(search),
                    Job.description.contains(search),
                    Job.tags.contains(search)
                )
            )
        if location:
            query = query.filter(Job.location.contains(location))
        
        jobs = query.order_by(Job.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'jobs': [job.to_dict() for job in jobs.items],
            'total': jobs.total,
            'pages': jobs.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    try:
        job = Job.query.get_or_404(job_id)
        return jsonify(job.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs', methods=['POST'])
def create_job():
    try:
        data = request.get_json()
        
        job = Job(
            title=data['title'],
            company=data['company'],
            location=data['location'],
            job_type=data['job_type'],
            category=data['category'],
            salary=data['salary'],
            description=data['description'],
            tags=','.join(data.get('tags', []))
        )
        
        db.session.add(job)
        db.session.commit()
        
        return jsonify(job.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    try:
        job = Job.query.get_or_404(job_id)
        data = request.get_json()
        
        job.title = data.get('title', job.title)
        job.company = data.get('company', job.company)
        job.location = data.get('location', job.location)
        job.job_type = data.get('job_type', job.job_type)
        job.category = data.get('category', job.category)
        job.salary = data.get('salary', job.salary)
        job.description = data.get('description', job.description)
        job.status = data.get('status', job.status)
        
        if 'tags' in data:
            job.tags = ','.join(data['tags'])
        
        db.session.commit()
        return jsonify(job.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    try:
        job = Job.query.get_or_404(job_id)
        db.session.delete(job)
        db.session.commit()
        return jsonify({'message': 'Job deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# API Routes for Applications
@app.route('/api/applications', methods=['GET'])
def get_applications():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        job_id = request.args.get('job_id')
        
        query = Application.query
        
        if status:
            query = query.filter_by(status=status)
        if job_id:
            query = query.filter_by(job_id=job_id)
        
        applications = query.order_by(Application.applied_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'applications': [app.to_dict() for app in applications.items],
            'total': applications.total,
            'pages': applications.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications', methods=['POST'])
def create_application():
    try:
        data = request.get_json()
        
        application = Application(
            job_id=data['job_id'],
            applicant_name=data['applicant_name'],
            applicant_email=data['applicant_email'],
            applicant_phone=data['applicant_phone'],
            cover_letter=data['cover_letter'],
            resume_filename=data['resume_filename']
        )
        
        db.session.add(application)
        db.session.commit()
        
        return jsonify(application.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications/<int:app_id>', methods=['PUT'])
def update_application_status(app_id):
    try:
        application = Application.query.get_or_404(app_id)
        data = request.get_json()
        
        application.status = data.get('status', application.status)
        db.session.commit()
        
        return jsonify(application.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
def delete_application(app_id):
    try:
        application = Application.query.get_or_404(app_id)
        db.session.delete(application)
        db.session.commit()
        return jsonify({'message': 'Application deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# API Routes for Companies
@app.route('/api/companies', methods=['GET'])
def get_companies():
    try:
        companies = Company.query.order_by(Company.name).all()
        return jsonify([company.to_dict() for company in companies])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies', methods=['POST'])
def create_company():
    try:
        data = request.get_json()
        
        company = Company(
            name=data['name'],
            description=data.get('description'),
            website=data.get('website'),
            location=data.get('location'),
            industry=data.get('industry'),
            size=data.get('size'),
            logo_url=data.get('logo_url')
        )
        
        db.session.add(company)
        db.session.commit()
        
        return jsonify(company.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Dashboard Statistics
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        active_jobs = Job.query.filter_by(status='active').count()
        total_applications = Application.query.count()
        pending_applications = Application.query.filter_by(status='pending').count()
        active_companies = Company.query.count()
        
        recent_applications = Application.query.order_by(
            Application.applied_at.desc()
        ).limit(5).all()
        
        return jsonify({
            'active_jobs': active_jobs,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'active_companies': active_companies,
            'recent_applications': [app.to_dict() for app in recent_applications]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Initialize Database
def create_tables():
    with app.app_context():
        db.create_all()
        
        # Add sample data if database is empty
        if Job.query.count() == 0:
            sample_jobs = [
                Job(
                    title='Senior Frontend Developer',
                    company='TechCorp Solutions',
                    location='San Francisco, CA',
                    job_type='full-time',
                    category='technology',
                    salary='$120,000 - $160,000',
                    description='We are looking for an experienced Frontend Developer to join our growing team and help build amazing user experiences.',
                    tags='React,JavaScript,CSS,HTML5'
                ),
                Job(
                    title='Digital Marketing Manager',
                    company='GrowthHub Inc',
                    location='New York, NY',
                    job_type='full-time',
                    category='marketing',
                    salary='$80,000 - $100,000',
                    description='Join our marketing team to drive digital campaigns and help us reach new heights in customer engagement.',
                    tags='SEO,SEM,Social Media,Analytics'
                ),
                Job(
                    title='Sales Representative',
                    company='SalesForce Pro',
                    location='Chicago, IL',
                    job_type='remote',
                    category='sales',
                    salary='$60,000 - $80,000 + Commission',
                    description='Looking for motivated sales professionals to help expand our client base and drive revenue growth.',
                    tags='B2B Sales,CRM,Negotiation,Communication'
                )
            ]
            
            for job in sample_jobs:
                db.session.add(job)
            
            if Company.query.count() == 0:
                sample_companies = [
                    Company(
                        name='TechCorp Solutions',
                        description='Leading technology company specializing in innovative software solutions.',
                        website='https://techcorp.com',
                        location='San Francisco, CA',
                        industry='Technology',
                        size='Large'
                    ),
                    Company(
                        name='GrowthHub Inc',
                        description='Digital marketing agency helping businesses grow their online presence.',
                        website='https://growthhub.com',
                        location='New York, NY',
                        industry='Marketing',
                        size='Medium'
                    )
                ]
                
                for company in sample_companies:
                    db.session.add(company)
            
            db.session.commit()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
