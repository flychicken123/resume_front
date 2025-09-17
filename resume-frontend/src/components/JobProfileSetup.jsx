import React, { useState, useEffect } from 'react';
import { getJobProfile, saveJobProfile } from '../api';
import './JobProfileSetup.css';

const JobProfileSetup = ({ missingFields, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    phone_number: '',
    country: 'United States',
    city: '',
    state: '',
    zip_code: '',
    address: '',
    linkedin_url: '',
    portfolio_url: '',
    work_authorization: '',
    requires_sponsorship: false,
    willing_to_relocate: false,
    salary_expectation_min: '',
    salary_expectation_max: '',
    preferred_locations: '',
    available_start_date: 'immediately',
    years_of_experience: '',
    gender: '',
    ethnicity: '',
    veteran_status: '',
    disability_status: '',
    sexual_orientation: '',
    transgender_status: '',
    most_recent_degree: '',
    graduation_year: '',
    university: '',
    major: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const response = await getJobProfile();
      if (response.exists && response.profile) {
        setFormData({
          phone_number: response.profile.phone_number || '',
          country: response.profile.country || 'United States',
          city: response.profile.city || '',
          state: response.profile.state || '',
          zip_code: response.profile.zip_code || '',
          address: response.profile.address || '',
          linkedin_url: response.profile.linkedin_url || '',
          portfolio_url: response.profile.portfolio_url || '',
          work_authorization: response.profile.work_authorization || '',
          requires_sponsorship: response.profile.requires_sponsorship || false,
          willing_to_relocate: response.profile.willing_to_relocate || false,
          salary_expectation_min: response.profile.salary_expectation_min || '',
          salary_expectation_max: response.profile.salary_expectation_max || '',
          preferred_locations: response.profile.preferred_locations || '',
          available_start_date: response.profile.available_start_date || 'immediately',
          years_of_experience: response.profile.years_of_experience || '',
          gender: response.profile.gender || '',
          ethnicity: response.profile.ethnicity || '',
          veteran_status: response.profile.veteran_status || '',
          disability_status: response.profile.disability_status || '',
          sexual_orientation: response.profile.sexual_orientation || '',
          transgender_status: response.profile.transgender_status || '',
          most_recent_degree: response.profile.most_recent_degree || '',
          graduation_year: response.profile.graduation_year || '',
          university: response.profile.university || '',
          major: response.profile.major || ''
        });
      }
    } catch (err) {
      console.error('Failed to load existing profile:', err);
    } finally {
      setInitialLoad(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.linkedin_url || !formData.work_authorization) {
        throw new Error('LinkedIn URL and Work Authorization are required');
      }
      
      if (!formData.country || !formData.city) {
        throw new Error('Country and City are required');
      }
      
      if (isFieldRequired('phone_number') && !formData.phone_number) {
        throw new Error('Phone number is required');
      }

      const profileData = {
        ...formData,
        salary_expectation_min: formData.salary_expectation_min ? parseInt(formData.salary_expectation_min) : 0,
        salary_expectation_max: formData.salary_expectation_max ? parseInt(formData.salary_expectation_max) : 0,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : 0,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : 0
      };

      await saveJobProfile(profileData);
      setSuccess('Job profile saved successfully!');
      
      // Call onSave callback to notify parent
      if (onSave) {
        setTimeout(() => onSave(), 1000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save job profile');
    } finally {
      setLoading(false);
    }
  };

  const isFieldRequired = (fieldName) => {
    return missingFields && missingFields.includes(fieldName);
  };

  if (initialLoad) {
    return (
      <div className="job-profile-setup">
        <div className="loading">Loading your job profile...</div>
      </div>
    );
  }

  return (
    <div className="job-profile-setup">
      <div className="profile-setup-header">
        <h2>📋 Complete Your Job Application Profile</h2>
        <p>We need some additional information to automatically fill job application forms.</p>
        {missingFields && missingFields.length > 0 && (
          <div className="missing-fields-alert">
            <strong>Missing required fields:</strong> {missingFields.map(field => field.replace('_', ' ')).join(', ')}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="job-profile-form">
        <div className="form-section">
          <h3>📱 Contact & Professional Links</h3>
          
          <div className="form-group">
            <label htmlFor="phone_number">
              Phone Number {isFieldRequired('phone_number') && <span className="required">*</span>}
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              required={isFieldRequired('phone_number')}
              className={isFieldRequired('phone_number') ? 'required-field' : ''}
            />
            <small className="form-hint">Your contact phone number for job applications</small>
          </div>

          <div className="form-group">
            <label htmlFor="country">
              Country <span className="required">*</span>
            </label>
            <select
              id="country"
              name="country"
              value={formData.country || 'United States'}
              onChange={handleChange}
              required
            >
              <option value="">Select Country</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="India">India</option>
              <option value="China">China</option>
              <option value="Japan">Japan</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="city">
              City <span className="required">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="San Francisco"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">
              State/Province
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="CA"
            />
          </div>

          <div className="form-group">
            <label htmlFor="zip_code">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              placeholder="94105"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="linkedin_url">
              LinkedIn Profile URL {isFieldRequired('linkedin_url') && <span className="required">*</span>}
            </label>
            <input
              type="url"
              id="linkedin_url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/your-profile"
              required={isFieldRequired('linkedin_url')}
              className={isFieldRequired('linkedin_url') ? 'required-field' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="portfolio_url">Portfolio/Website URL (Optional)</label>
            <input
              type="url"
              id="portfolio_url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleChange}
              placeholder="https://your-portfolio.com"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>🏢 Work Authorization</h3>
          
          <div className="form-group">
            <label htmlFor="work_authorization">
              Are you authorized to work in the US? {isFieldRequired('work_authorization') && <span className="required">*</span>}
            </label>
            <select
              id="work_authorization"
              name="work_authorization"
              value={formData.work_authorization}
              onChange={handleChange}
              required={isFieldRequired('work_authorization')}
              className={isFieldRequired('work_authorization') ? 'required-field' : ''}
            >
              <option value="">Select work authorization status...</option>
              <option value="yes">Yes, I am authorized to work in the US</option>
              <option value="no">No, I am not authorized to work in the US</option>
              <option value="requires_sponsorship">I require visa sponsorship</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="requires_sponsorship"
                checked={formData.requires_sponsorship}
                onChange={handleChange}
              />
              I require visa sponsorship now or in the future
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>📍 Location & Preferences</h3>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="willing_to_relocate"
                checked={formData.willing_to_relocate}
                onChange={handleChange}
              />
              I am willing to relocate for this position
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="preferred_locations">Preferred Work Locations (Optional)</label>
            <input
              type="text"
              id="preferred_locations"
              name="preferred_locations"
              value={formData.preferred_locations}
              onChange={handleChange}
              placeholder="San Francisco, New York, Remote"
            />
            <small className="form-hint">Separate multiple locations with commas</small>
          </div>
        </div>

        <div className="form-section">
          <h3>💼 Experience & Availability</h3>
          
          <div className="form-group">
            <label htmlFor="years_of_experience">
              Years of Experience {isFieldRequired('years_of_experience') && <span className="required">*</span>}
            </label>
            <input
              type="number"
              id="years_of_experience"
              name="years_of_experience"
              value={formData.years_of_experience}
              onChange={handleChange}
              min="0"
              max="50"
              placeholder="3"
              required={isFieldRequired('years_of_experience')}
              className={isFieldRequired('years_of_experience') ? 'required-field' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="available_start_date">Available Start Date</label>
            <select
              id="available_start_date"
              name="available_start_date"
              value={formData.available_start_date}
              onChange={handleChange}
            >
              <option value="immediately">Immediately</option>
              <option value="2_weeks">2 weeks notice</option>
              <option value="1_month">1 month notice</option>
              <option value="negotiable">Negotiable</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>💰 Salary Expectations (Optional)</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="salary_expectation_min">Minimum Salary</label>
              <input
                type="number"
                id="salary_expectation_min"
                name="salary_expectation_min"
                value={formData.salary_expectation_min}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="80000"
              />
            </div>
            <div className="form-group">
              <label htmlFor="salary_expectation_max">Maximum Salary</label>
              <input
                type="number"
                id="salary_expectation_max"
                name="salary_expectation_max"
                value={formData.salary_expectation_max}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="120000"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>📊 Diversity Information (Optional)</h3>
          <p className="section-description">
            This information helps employers track diversity and inclusion efforts. 
            All fields are optional and will not affect your application evaluation.
          </p>
          
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender || ''}
              onChange={handleChange}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ethnicity">Ethnicity/Race</label>
            <select
              id="ethnicity"
              name="ethnicity"
              value={formData.ethnicity || ''}
              onChange={handleChange}
            >
              <option value="">Prefer not to say</option>
              <option value="american_indian_alaska_native">American Indian or Alaska Native</option>
              <option value="asian">Asian</option>
              <option value="black_african_american">Black or African American</option>
              <option value="hispanic_latino">Hispanic or Latino</option>
              <option value="native_hawaiian_pacific_islander">Native Hawaiian or Pacific Islander</option>
              <option value="white">White</option>
              <option value="two_or_more">Two or More Races</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="veteran_status">Veteran Status</label>
            <select
              id="veteran_status"
              name="veteran_status"
              value={formData.veteran_status || ''}
              onChange={handleChange}
            >
              <option value="">Select Status</option>
              <option value="yes">Yes, I am a veteran</option>
              <option value="no">No, I am not a veteran</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="disability_status">Disability Status</label>
            <select
              id="disability_status"
              name="disability_status"
              value={formData.disability_status || ''}
              onChange={handleChange}
            >
              <option value="">Select Status</option>
              <option value="yes">Yes, I have a disability</option>
              <option value="no">No, I do not have a disability</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="sexual_orientation">Sexual Orientation</label>
            <select
              id="sexual_orientation"
              name="sexual_orientation"
              value={formData.sexual_orientation || ''}
              onChange={handleChange}
            >
              <option value="">Select an option</option>
              <option value="Heterosexual or straight">Heterosexual or straight</option>
              <option value="Gay or lesbian">Gay or lesbian</option>
              <option value="Bisexual">Bisexual</option>
              <option value="Queer">Queer</option>
              <option value="Other">Other</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="transgender_status">Transgender Status</label>
            <select
              id="transgender_status"
              name="transgender_status"
              value={formData.transgender_status || ''}
              onChange={handleChange}
            >
              <option value="">Select an option</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="most_recent_degree">Most Recent Degree</label>
            <select
              id="most_recent_degree"
              name="most_recent_degree"
              value={formData.most_recent_degree || ''}
              onChange={handleChange}
            >
              <option value="">Select your degree</option>
              <option value="High School">High School</option>
              <option value="Associate's">Associate's</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="MBA">MBA</option>
              <option value="PhD">PhD</option>
              <option value="JD">JD</option>
              <option value="MD">MD</option>
              <option value="Other Professional Degree">Other Professional Degree</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="university">University/Institution</label>
            <input
              type="text"
              id="university"
              name="university"
              value={formData.university || ''}
              onChange={handleChange}
              placeholder="e.g., Stanford University"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="major">Major/Field of Study</label>
            <input
              type="text"
              id="major"
              name="major"
              value={formData.major || ''}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="graduation_year">Graduation Year</label>
            <input
              type="number"
              id="graduation_year"
              name="graduation_year"
              value={formData.graduation_year || ''}
              onChange={handleChange}
              placeholder="e.g., 2020"
              min="1950"
              max={new Date().getFullYear() + 5}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Profile & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobProfileSetup;