/**
 * @file src/components/profile/EditProfileModal.tsx
 * @description Modal for editing profile information
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { userAPINew, skillAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button, Input, Textarea, Badge } from "@/components/common";

interface EditProfileModalProps {
  user: any;
  profile: any;
  onClose: () => void;
}

export default function EditProfileModal({
  user,
  profile,
  onClose,
}: EditProfileModalProps) {
  const { updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState("");

  const isDeveloper = user.role === "DEVELOPER";

  const [formData, setFormData] = useState({
    // Common fields
    headline: profile?.headline || "",
    bio: profile?.bio || profile?.companyDescription || "",
    location: {
      city: profile?.location?.city || "",
      state: profile?.location?.state || "",
      country: profile?.location?.country || "",
    },
    portfolioUrl: profile?.portfolioUrl || "",
    linkedinUrl: profile?.linkedinUrl || "",
    twitterUrl: profile?.twitterUrl || "",
    // Developer fields
    skills: profile?.skills || [],
    yearsOfExperience: profile?.yearsOfExperience || 0,
    githubUsername: profile?.githubUsername || "",
    isOpenToWork: profile?.isOpenToWork || false,
    preferredWorkTypes: profile?.preferredWorkTypes || [],
    // Recruiter fields
    companyName: profile?.companyName || "",
    companyWebsite: profile?.companyWebsite || "",
    companyDescription: profile?.companyDescription || "",
    companySize: profile?.companySize || "",
    industry: profile?.industry || "",
    positionTitle: profile?.positionTitle || "",
    hiringRegions: profile?.hiringRegions || [],
  });

  // Fetch available skills
  useEffect(() => {
    if (isDeveloper) {
      skillAPI.getAll().then((res) => {
        setAvailableSkills(res.data.data || []);
      });
    }
  }, [isDeveloper]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    } else if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
    setSkillSearch("");
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s: string) => s !== skill),
    }));
  };

  const handleWorkTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredWorkTypes: prev.preferredWorkTypes.includes(type)
        ? prev.preferredWorkTypes.filter((t: string) => t !== type)
        : [...prev.preferredWorkTypes, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await userAPINew.updateProfile(formData);
      updateProfile(response.data.data);
      toast.success("Profile updated successfully!");
      onClose();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSkills = availableSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !formData.skills.includes(skill.slug)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto max-h-[calc(90vh-140px)]"
          >
            <div className="px-6 py-4 space-y-6">
              {/* Headline */}
              <Input
                label={isDeveloper ? "Headline" : "Position Title"}
                name={isDeveloper ? "headline" : "positionTitle"}
                value={isDeveloper ? formData.headline : formData.positionTitle}
                onChange={handleChange}
                placeholder={
                  isDeveloper
                    ? "Full Stack Developer | React & Node.js"
                    : "Senior Recruiter"
                }
              />

              {/* Bio / Company Description */}
              <Textarea
                label={isDeveloper ? "Bio" : "Company Description"}
                name={isDeveloper ? "bio" : "companyDescription"}
                value={isDeveloper ? formData.bio : formData.companyDescription}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={4}
              />

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                  <Input
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                  <Input
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Developer-specific fields */}
              {isDeveloper && (
                <>
                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.skills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="primary"
                          className="flex items-center gap-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 hover:text-red-600"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="relative">
                      <Input
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Search skills..."
                      />
                      {skillSearch && filteredSkills.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredSkills.slice(0, 10).map((skill) => (
                            <button
                              key={skill.slug}
                              type="button"
                              onClick={() => handleAddSkill(skill.slug)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <FiPlus className="w-4 h-4 text-gray-400" />
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Years of Experience */}
                  <Input
                    label="Years of Experience"
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    min={0}
                    max={50}
                  />

                  {/* GitHub Username */}
                  <Input
                    label="GitHub Username"
                    name="githubUsername"
                    value={formData.githubUsername}
                    onChange={handleChange}
                    placeholder="username"
                  />

                  {/* Open to Work */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isOpenToWork"
                      name="isOpenToWork"
                      checked={formData.isOpenToWork}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="isOpenToWork"
                      className="text-sm text-gray-700"
                    >
                      I&apos;m open to work opportunities
                    </label>
                  </div>

                  {/* Preferred Work Types */}
                  {formData.isOpenToWork && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Work Types
                      </label>
                      <div className="flex gap-2">
                        {["REMOTE", "ONSITE", "HYBRID"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleWorkTypeToggle(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              formData.preferredWorkTypes.includes(type)
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Recruiter-specific fields */}
              {!isDeveloper && (
                <>
                  <Input
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Acme Inc."
                  />

                  <Input
                    label="Company Website"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Size
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="501-1000">501-1000</option>
                      <option value="1000+">1000+</option>
                    </select>
                  </div>

                  <Input
                    label="Industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="Technology"
                  />
                </>
              )}

              {/* Social Links */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Social Links</h4>
                <Input
                  label="Portfolio URL"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                />
                <Input
                  label="LinkedIn URL"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
                <Input
                  label="Twitter URL"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleChange}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} leftIcon={<FiSave />}>
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
