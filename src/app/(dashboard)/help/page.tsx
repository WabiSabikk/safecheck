'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Thermometer,
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Utensils,
  Bug,
  HandMetal,
  FileText,
  Award,
  Package,
  Tag,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const temperatureGuide = [
  { zone: 'Refrigeration', range: '32-41°F (0-5°C)', color: 'bg-blue-100 text-blue-800 border-blue-200', description: 'All TCS (Time/Temperature Control for Safety) cold foods' },
  { zone: 'Freezer', range: '0°F (-18°C) or below', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', description: 'Frozen storage — check for ice crystals' },
  { zone: 'Danger Zone', range: '41-135°F (5-57°C)', color: 'bg-red-100 text-red-800 border-red-200', description: 'Bacteria multiply rapidly — max 4 hours total' },
  { zone: 'Hot Holding', range: '135°F (57°C) or above', color: 'bg-orange-100 text-orange-800 border-orange-200', description: 'Steam tables, warming drawers, hot-holding equipment' },
];

const cookingTemps = [
  { food: 'Poultry (chicken, turkey, duck)', temp: '165°F (74°C)', time: '15 seconds', icon: '🍗' },
  { food: 'Ground meat (beef, pork, lamb)', temp: '160°F (71°C)', time: '15 seconds', icon: '🍔' },
  { food: 'Seafood, steaks, pork chops, eggs', temp: '145°F (63°C)', time: '15 seconds', icon: '🐟' },
  { food: 'Fruits, vegetables, grains (hot)', temp: '135°F (57°C)', time: 'Immediate', icon: '🥦' },
  { food: 'Reheated foods (leftovers)', temp: '165°F (74°C)', time: '15 seconds', icon: '♨️' },
];

const allergens = [
  'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts',
  'Peanuts', 'Wheat', 'Soybeans', 'Sesame',
];

const inspectionChecklist = [
  { area: 'Temperature Logs', detail: 'Inspectors spot-check last 5 days of temperature records. All entries must have date, time, temp reading, and staff initials.', critical: true },
  { area: 'Food Storage', detail: 'Raw meats below ready-to-eat foods. All items 6"+ off floor. Covered, labeled with date. FIFO rotation enforced.', critical: true },
  { area: 'Cross-Contamination', detail: 'Separate cutting boards for raw/cooked. Color-coding system. Allergen isolation in storage.', critical: true },
  { area: 'Employee Hygiene', detail: 'No visibly ill staff. Open wounds covered. Handwashing observed. Hair restraints worn.', critical: true },
  { area: 'Staff Certifications', detail: 'At least 1 manager with Food Protection Manager (CFP) certificate. All food handlers certified per state law.', critical: false },
  { area: 'Equipment', detail: 'Thermometers calibrated. All cold units running. No visible damage or buildup.', critical: false },
  { area: 'Corrective Actions', detail: 'Documentation of what was done when temperatures were out of range. Inspector wants to see the trail.', critical: true },
  { area: 'Pest Control', detail: 'No evidence of pests (droppings, damage, live insects). Pest control service records available.', critical: false },
  { area: 'Cleanliness', detail: 'Food contact surfaces sanitized. Floors, walls clean. Trash removed regularly. Sanitizer test strips available.', critical: false },
];

const faqItems: FaqItem[] = [
  {
    question: 'How often should I log temperatures?',
    answer: 'FDA recommends checking refrigerators and freezers at least 2 times per day. Hot-holding units should be checked before and during service. With SafeCheck, you can set up reminders to make this automatic.',
    category: 'Temperature',
  },
  {
    question: 'What happens if a temperature is out of range?',
    answer: 'SafeCheck automatically flags the reading in red and prompts you to create a Corrective Action. Document what happened, what you did about it (moved food, adjusted equipment, discarded items), and mark it resolved. This trail is exactly what inspectors want to see.',
    category: 'Temperature',
  },
  {
    question: 'Do health inspectors accept digital temperature logs?',
    answer: 'Most US states now accept digital logs. SafeCheck lets you export PDF reports that include all required fields (date, time, temperature, staff name, equipment). Always check with your local health department for specific requirements.',
    category: 'Compliance',
  },
  {
    question: 'What is the "Danger Zone"?',
    answer: 'The temperature range between 41°F and 135°F (5°C-57°C) where bacteria multiply rapidly. Food should not stay in this zone for more than 4 hours total (cumulative). After 4 hours, food must be discarded.',
    category: 'Temperature',
  },
  {
    question: 'What certifications does my staff need?',
    answer: 'Requirements vary by state. Generally: at least 1 manager needs a Food Protection Manager (CFP) certificate, and all food handlers need a Food Handler certificate. SafeCheck tracks expiration dates and alerts you 30 days before renewal.',
    category: 'Compliance',
  },
  {
    question: 'How long should I keep food safety records?',
    answer: 'Best practice is 1 year minimum. Most states require 30-365 days depending on the record type. SafeCheck stores all your data digitally with automatic retention policies.',
    category: 'Compliance',
  },
  {
    question: 'What are the Big 9 allergens?',
    answer: 'The FDA requires labeling for 9 major allergens: Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, and Sesame (added in 2023). SafeCheck helps you track which items contain these allergens.',
    category: 'Allergens',
  },
  {
    question: 'How do I prepare for a health inspection?',
    answer: 'Keep daily temperature logs current, ensure all staff certifications are valid, maintain corrective action records, check that all food is properly stored and labeled. With SafeCheck, you can pull a compliance report instantly to show the inspector.',
    category: 'Compliance',
  },
  {
    question: 'Can SafeCheck work without internet?',
    answer: 'Yes! SafeCheck works fully offline. You can log temperatures, complete checklists, and record corrective actions without WiFi. Everything syncs automatically when you reconnect.',
    category: 'App',
  },
  {
    question: 'How do I add my kitchen equipment?',
    answer: 'Go to Settings > Equipment. Add each fridge, freezer, and hot-holding unit with its name and safe temperature range. SafeCheck will automatically flag readings outside these ranges.',
    category: 'App',
  },
];

const categories = ['All', 'Temperature', 'Compliance', 'Allergens', 'App'];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaq = faqItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-emerald-600" />
          Food Safety Guide
        </h1>
        <p className="text-muted-foreground mt-1">
          FDA compliance essentials, temperature requirements, and inspection preparation
        </p>
      </div>

      {/* Quick Reference Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <Thermometer className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold">Cold: 41°F or below</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check fridges 2x daily
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-6">
            <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
            <h3 className="font-semibold">Danger: 41-135°F</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Max 4 hours total
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <Utensils className="h-8 w-8 text-orange-600 mb-2" />
            <h3 className="font-semibold">Hot: 135°F or above</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Steam tables, hot-holding
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="pt-6">
            <ShieldCheck className="h-8 w-8 text-emerald-600 mb-2" />
            <h3 className="font-semibold">9 Major Allergens</h3>
            <p className="text-sm text-muted-foreground mt-1">
              FDA-required labeling
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Zones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-emerald-600" />
            Temperature Safety Zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {temperatureGuide.map((zone) => (
              <div key={zone.zone} className={`rounded-lg border p-4 ${zone.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{zone.zone}</h4>
                    <p className="text-sm mt-0.5 opacity-80">{zone.description}</p>
                  </div>
                  <span className="font-mono font-bold text-lg whitespace-nowrap ml-4">
                    {zone.range}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cooking Temperatures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-emerald-600" />
            Minimum Cooking Temperatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-sm font-medium text-muted-foreground">Food Type</th>
                  <th className="text-left py-2 pr-4 text-sm font-medium text-muted-foreground">Min. Temperature</th>
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">Hold Time</th>
                </tr>
              </thead>
              <tbody>
                {cookingTemps.map((item) => (
                  <tr key={item.food} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <span className="mr-2">{item.icon}</span>
                      <span className="text-sm">{item.food}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="font-mono">
                        {item.temp}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Big 9 Allergens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-emerald-600" />
            FDA Big 9 Allergens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Federal law requires labeling for these 9 major allergens. Sesame was added as the 9th allergen in January 2023 under the FASTER Act.
          </p>
          <div className="flex flex-wrap gap-2">
            {allergens.map((allergen) => (
              <Badge key={allergen} variant="secondary" className="text-sm py-1 px-3">
                {allergen}
              </Badge>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Cross-contact prevention:</strong> Use separate prep areas, utensils, and storage for allergen-containing items. Train all staff to recognize and communicate allergen risks.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Health Inspection Prep */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            Health Inspection Preparation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            What inspectors check and how to be ready. Items marked as critical can result in major violations or shutdown.
          </p>
          <div className="space-y-3">
            {inspectionChecklist.map((item) => (
              <div
                key={item.area}
                className={`rounded-lg border p-4 ${
                  item.critical ? 'border-red-200 bg-red-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{item.area}</h4>
                      {item.critical && (
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h4 className="font-medium text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Pro Tip
            </h4>
            <p className="text-sm text-emerald-700 mt-1">
              Inspectors love restaurants with systematic daily logs, quick access to documentation, and corrective action trails. SafeCheck gives you all three — just show them your Reports page.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Routine Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Daily Food Safety Routine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <h4 className="font-medium text-emerald-800">Opening Shift (10-15 min)</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-emerald-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Check all fridge/freezer temps — log in SafeCheck
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Verify food labels (date, FIFO rotation)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Check handwashing stations (soap, paper towels, water)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Staff health check — no illness or open wounds
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Complete Opening Checklist in SafeCheck
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <h4 className="font-medium text-blue-800">Mid-Shift (2-3 min)</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  Check hot-holding temps (must be 135°F+)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  Verify cold items still at 41°F or below
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  Quick handwashing compliance check
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
              <h4 className="font-medium text-purple-800">Closing Shift (5-10 min)</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-purple-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  Final temperature check on all units
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  Ensure hot foods cooled to 41°F within 4 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  Discard expired/questionable food
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  Sanitize all food contact surfaces
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  Complete Closing Checklist in SafeCheck
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <h4 className="font-medium text-gray-800">Weekly (Monday, 5 min)</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                  Review weekly compliance on Dashboard
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                  Check for upcoming certification expirations
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                  Resolve any open corrective actions
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                  Export reports if needed for records
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-emerald-600" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ list */}
          <div className="space-y-2">
            {filteredFaq.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No matching questions found. Try a different search term.
              </p>
            ) : (
              filteredFaq.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="flex items-center justify-between w-full p-4 text-left"
                  >
                    <span className="font-medium text-sm pr-4">{item.question}</span>
                    {expandedFaq === index ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                      <Badge variant="outline" className="mt-2 text-xs">{item.category}</Badge>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
