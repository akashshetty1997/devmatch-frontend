/**
 * @file src/components/profile/EditProfileModal.tsx
 * @description Reddit-style, dark-mode safe profile editor modal (sticky header/footer, sectioned layout)
 */

"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSave, FiPlus, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import { profileAPI, skillAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button, Input, Textarea, Badge } from "@/components/common";

interface EditProfileModalProps {
  user: any;
  profile: any;
  onClose: () => void;
}

type WorkType = "REMOTE" | "ONSITE" | "HYBRID";

export default function EditProfileModal({
  user,
  profile,
  onClose,
}: EditProfileModalProps) {
  const { updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillOpen, setSkillOpen] = useState(false);

  const isDeveloper = user?.role === "DEVELOPER";

  const [formData, setFormData] = useState({
    // Common
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

    // Developer
    skills: profile?.skills || [],
    yearsOfExperience: profile?.yearsOfExperience || 0,
    githubUsername: profile?.githubUsername || "",
    isOpenToWork: profile?.isOpenToWork || false,
    preferredWorkTypes: profile?.preferredWorkTypes || [],

    // Recruiter
    companyName: profile?.companyName || "",
    companyWebsite: profile?.companyWebsite || "",
    companyDescription: profile?.companyDescription || "",
    companySize: profile?.companySize || "",
    industry: profile?.industry || "",
    positionTitle: profile?.positionTitle || "",
    hiringRegions: profile?.hiringRegions || [],
  });

  // Fetch skills once for devs
  useEffect(() => {
    if (!isDeveloper) return;
    skillAPI
      .getAll()
      .then((res) => setAvailableSkills(res.data.data || []))
      .catch(() => setAvailableSkills([]));
  }, [isDeveloper]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((p) => ({
        ...p,
        location: { ...p.location, [field]: value },
      }));
      return;
    }

    if (type === "checkbox") {
      setFormData((p) => ({ ...p, [name]: checked }));
      return;
    }

    if (type === "number") {
      setFormData((p) => ({ ...p, [name]: parseInt(value) || 0 }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Handle textarea changes
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAddSkill = (slug: string) => {
    if (!slug) return;
    if (formData.skills.includes(slug)) return;
    setFormData((p) => ({ ...p, skills: [...p.skills, slug] }));
    setSkillSearch("");
    setSkillOpen(false);
  };

  const handleRemoveSkill = (slug: string) => {
    setFormData((p) => ({
      ...p,
      skills: p.skills.filter((s: string) => s !== slug),
    }));
  };

  const toggleWorkType = (t: WorkType) => {
    setFormData((p) => ({
      ...p,
      preferredWorkTypes: p.preferredWorkTypes.includes(t)
        ? p.preferredWorkTypes.filter((x: string) => x !== t)
        : [...p.preferredWorkTypes, t],
    }));
  };

  const filteredSkills = useMemo(() => {
    const q = skillSearch.trim().toLowerCase();
    const base = availableSkills.filter(
      (s) => !formData.skills.includes(s.slug)
    );
    if (!q) return base.slice(0, 10);
    return base
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [availableSkills, formData.skills, skillSearch]);

  const buildCleanPayload = () => {
    const hasLocation =
      !!formData.location.city ||
      !!formData.location.state ||
      !!formData.location.country;

    if (isDeveloper) {
      return {
        headline: formData.headline || undefined,
        bio: formData.bio || undefined,
        location: hasLocation ? formData.location : undefined,
        skills: formData.skills.length ? formData.skills : undefined,
        yearsOfExperience: formData.yearsOfExperience || undefined,
        githubUsername: formData.githubUsername || undefined,
        isOpenToWork: !!formData.isOpenToWork,
        preferredWorkTypes: formData.preferredWorkTypes.length
          ? formData.preferredWorkTypes
          : undefined,
        portfolioUrl: formData.portfolioUrl || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        twitterUrl: formData.twitterUrl || undefined,
      };
    }

    return {
      companyName: formData.companyName || undefined,
      companyWebsite: formData.companyWebsite || undefined,
      companyDescription: formData.companyDescription || undefined,
      companySize: formData.companySize || undefined,
      industry: formData.industry || undefined,
      positionTitle: formData.positionTitle || undefined,
      location: hasLocation ? formData.location : undefined,
      portfolioUrl: formData.portfolioUrl || undefined,
      linkedinUrl: formData.linkedinUrl || undefined,
      twitterUrl: formData.twitterUrl || undefined,
    };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = buildCleanPayload();
      const res = isDeveloper
        ? await profileAPI.updateDeveloperProfile(payload)
        : await profileAPI.updateRecruiterProfile(payload);

      updateProfile(res.data.data);
      toast.success("Profile updated");
      onClose();

      window.location.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl"
          role="dialog"
          aria-modal="true"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1117]/95 px-6 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Edit profile</h2>
                <p className="mt-0.5 text-xs text-white/55">
                  Keep it tight. A recruiter reads this in 10 seconds.
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {/* Section: Basics */}
                <Section title="Basics" subtitle="What you do + where you are.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label={isDeveloper ? "Headline" : "Position Title"}
                      name={isDeveloper ? "headline" : "positionTitle"}
                      value={
                        isDeveloper ? formData.headline : formData.positionTitle
                      }
                      onChange={handleInputChange}
                      placeholder={
                        isDeveloper
                          ? "Full Stack Dev • React • Node"
                          : "Senior Recruiter"
                      }
                    />
                    {isDeveloper ? (
                      <Input
                        label="GitHub Username"
                        name="githubUsername"
                        value={formData.githubUsername}
                        onChange={handleInputChange}
                        placeholder="username"
                      />
                    ) : (
                      <Input
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Acme Inc."
                      />
                    )}
                  </div>

                  <Textarea
                    label={isDeveloper ? "Bio" : "Company Description"}
                    name={isDeveloper ? "bio" : "companyDescription"}
                    value={
                      isDeveloper ? formData.bio : formData.companyDescription
                    }
                    onChange={handleTextareaChange}
                    placeholder={
                      isDeveloper
                        ? "2–3 lines. What you build, what you're good at."
                        : "What your company does. What you hire for."
                    }
                    rows={5}
                  />

                  <div>
                    <div className="mb-2 text-sm font-semibold text-white">
                      Location
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                      <Input
                        name="location.state"
                        value={formData.location.state}
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                      <Input
                        name="location.country"
                        value={formData.location.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </Section>

                {/* Section: Developer */}
                {isDeveloper && (
                  <Section
                    title="Developer details"
                    subtitle="Skills + availability."
                  >
                    {/* Skills */}
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">
                          Skills
                        </div>
                        <div className="text-xs text-white/45">
                          Add only what you can defend
                        </div>
                      </div>

                      {formData.skills.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {formData.skills.map((slug: string) => (
                            <Badge
                              key={slug}
                              variant="primary"
                              className="flex items-center gap-2 bg-blue-500/15 text-blue-300 border border-blue-500/25"
                            >
                              {slug}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(slug)}
                                className="rounded-md p-0.5 hover:bg-white/10"
                                aria-label={`Remove ${slug}`}
                              >
                                <FiX className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/55">
                          No skills added. This hurts your profile. Add 6–12
                          real skills.
                        </div>
                      )}

                      <div className="relative">
                        <Input
                          value={skillSearch}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setSkillSearch(e.target.value);
                            setSkillOpen(true);
                          }}
                          onFocus={() => setSkillOpen(true)}
                          placeholder="Search skills (e.g. react, node, mongo)"
                        />

                        {skillOpen &&
                          (skillSearch.trim().length > 0 ||
                            filteredSkills.length > 0) && (
                            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-xl">
                              <div className="max-h-56 overflow-y-auto p-1">
                                {filteredSkills.length === 0 ? (
                                  <div className="px-3 py-3 text-sm text-white/55">
                                    No matches
                                  </div>
                                ) : (
                                  filteredSkills.map((s: any) => (
                                    <button
                                      key={s.slug}
                                      type="button"
                                      onClick={() => handleAddSkill(s.slug)}
                                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10"
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate font-semibold text-white">
                                          {s.name}
                                        </div>
                                        <div className="truncate text-xs text-white/45">
                                          {s.slug}
                                        </div>
                                      </div>
                                      <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/65">
                                        <FiPlus className="h-4 w-4" />
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                              <div className="flex justify-end border-t border-white/10 p-2">
                                <button
                                  type="button"
                                  onClick={() => setSkillOpen(false)}
                                  className="rounded-xl px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/10"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Years of Experience"
                        type="number"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleInputChange}
                        min={0}
                        max={50}
                      />

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isOpenToWork"
                            name="isOpenToWork"
                            checked={formData.isOpenToWork}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded border-white/20 bg-transparent text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-sm font-semibold text-white">
                              Open to work
                            </div>
                            <div className="text-xs text-white/55">
                              Turn this on only if you&apos;ll actually respond.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {formData.isOpenToWork && (
                      <div>
                        <div className="mb-2 text-sm font-semibold text-white">
                          Preferred work types
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["REMOTE", "HYBRID", "ONSITE"] as WorkType[]).map(
                            (t) => {
                              const active =
                                formData.preferredWorkTypes.includes(t);
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => toggleWorkType(t)}
                                  className={[
                                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                                    active
                                      ? "border-blue-500 bg-blue-600 text-white"
                                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                                  ].join(" ")}
                                >
                                  {active ? (
                                    <FiCheck className="h-4 w-4" />
                                  ) : null}
                                  {t}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {/* Section: Recruiter */}
                {!isDeveloper && (
                  <Section title="Recruiter details" subtitle="Company basics.">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Company Website"
                        name="companyWebsite"
                        value={formData.companyWebsite}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-white">
                          Company Size
                        </label>
                        <select
                          name="companySize"
                          value={formData.companySize}
                          onChange={handleSelectChange}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                    </div>

                    <Input
                      label="Industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="Technology"
                    />
                  </Section>
                )}

                {/* Section: Links */}
                <Section
                  title="Links"
                  subtitle="Optional. Real links beat empty fields."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Portfolio URL"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleInputChange}
                      placeholder="https://yourportfolio.com"
                    />
                    <Input
                      label="LinkedIn URL"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <Input
                    label="Twitter/X URL"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleInputChange}
                    placeholder="https://x.com/username"
                  />
                </Section>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[#0d1117]/95 px-6 py-4 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-white/45">
                  Tip: short bio + 6–12 skills + GitHub = strongest profile.
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    leftIcon={<FiSave />}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4">
        <div className="text-sm font-bold text-white">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-xs text-white/55">{subtitle}</div>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
