import axios from 'axios';

export interface iNaturalistObservation {
  id: number;
  taxon: {
    id: number;
    name: string;
    preferred_common_name?: string;
    rank: string;
    rank_level: number;
    ancestor_ids: number[];
    iconic_taxon_name: string;
    is_active: boolean;
  };
  quality_grade: string;
  identifications_count: number;
  identifications_agree: number;
  identifications_disagree: number;
  community_taxon_id?: number;
  community_taxon?: {
    id: number;
    name: string;
    preferred_common_name?: string;
    rank: string;
    iconic_taxon_name: string;
  };
  photos: Array<{
    id: number;
    url: string;
    medium_url: string;
    square_url: string;
    large_url: string;
  }>;
  place_guess?: string;
  observed_on: string;
  time_observed_at?: string;
  user: {
    id: number;
    login: string;
  };
  created_at: string;
  updated_at: string;
}

export interface iNaturalistIdentification {
  taxon: {
    id: number;
    name: string;
    preferred_common_name?: string;
    rank: string;
    iconic_taxon_name: string;
    ancestor_ids: number[];
  };
  score: number;
  vision_score?: number;
  frequency_score?: number;
  category: string;
}

export interface iNaturalistResponse {
  results: iNaturalistIdentification[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface iNaturalistTaxon {
  id: number;
  name: string;
  preferred_common_name?: string;
  rank: string;
  rank_level: number;
  iconic_taxon_name: string;
  ancestor_ids: number[];
  is_active: boolean;
  wikipedia_url?: string;
  observations_count: number;
  listed_taxa_count: number;
  atlas_id?: number;
  complete_species_count?: number;
  parent_id?: number;
  extinct: boolean;
  threatened: boolean;
  introduced: boolean;
  native: boolean;
  endemic: boolean;
  photos: Array<{
    id: number;
    url: string;
    medium_url: string;
    square_url: string;
    large_url: string;
  }>;
}

class iNaturalistAPI {
  private baseURL = 'https://api.inaturalist.org/v1';
  private userAgent = 'BuggiesWithBrandon/1.0 (https://buggies-with-brandon.vercel.app)';

  /**
   * Identify species using Google Vision labels to search iNaturalist database
   */
  async identifySpeciesFromLabels(labels: string[], _location?: { lat: number; lng: number }): Promise<iNaturalistIdentification[]> {
    try {
      console.log('🔍 Searching iNaturalist with labels:', labels);
      
      const results: iNaturalistIdentification[] = [];
      
      // Search for each relevant label
      for (const label of labels) {
        const taxa = await this.searchTaxa(label, {
          per_page: 5,
          rank: 'species'
        });
        
        for (const taxon of taxa) {
          // Calculate confidence based on label match and observation count
          const labelMatchScore = this.calculateLabelMatchScore(label, taxon);
          const observationScore = Math.min(taxon.observations_count / 1000, 1); // Normalize to 0-1
          const confidence = (labelMatchScore + observationScore) / 2;
          
          if (confidence > 0.3) { // Only include reasonably confident matches
            results.push({
              taxon: {
                id: taxon.id,
                name: taxon.name,
                preferred_common_name: taxon.preferred_common_name,
                rank: taxon.rank,
                iconic_taxon_name: taxon.iconic_taxon_name,
                ancestor_ids: taxon.ancestor_ids
              },
              score: confidence,
              vision_score: labelMatchScore,
              frequency_score: observationScore,
              category: this.getCategoryFromIconicTaxon(taxon.iconic_taxon_name)
            });
          }
        }
      }
      
      // Sort by confidence and remove duplicates
      const uniqueResults = this.removeDuplicateTaxa(results);
      const sortedResults = uniqueResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      console.log(`✅ Found ${sortedResults.length} iNaturalist matches`);
      return sortedResults.slice(0, 10); // Return top 10 results
      
    } catch (error) {
      console.error('iNaturalist label search error:', error);
      return [];
    }
  }

  /**
   * Calculate how well a label matches a taxon
   */
  private calculateLabelMatchScore(label: string, taxon: iNaturalistTaxon): number {
    const labelLower = label.toLowerCase();
    const commonName = taxon.preferred_common_name?.toLowerCase() || '';
    const scientificName = taxon.name.toLowerCase();
    
    // Exact match gets highest score
    if (commonName === labelLower || scientificName === labelLower) {
      return 1.0;
    }
    
    // Partial match in common name
    if (commonName.includes(labelLower) || labelLower.includes(commonName)) {
      return 0.8;
    }
    
    // Partial match in scientific name
    if (scientificName.includes(labelLower) || labelLower.includes(scientificName)) {
      return 0.6;
    }
    
    // Word boundary match
    const labelWords = labelLower.split(/\s+/);
    const commonWords = commonName.split(/\s+/);
    const scientificWords = scientificName.split(/\s+/);
    
    const commonWordMatches = labelWords.filter(word => 
      commonWords.some(cw => cw.includes(word) || word.includes(cw))
    ).length;
    
    const scientificWordMatches = labelWords.filter(word => 
      scientificWords.some(sw => sw.includes(word) || word.includes(sw))
    ).length;
    
    const wordMatchScore = Math.max(commonWordMatches, scientificWordMatches) / labelWords.length;
    return wordMatchScore * 0.7;
  }

  /**
   * Get category from iconic taxon name
   */
  private getCategoryFromIconicTaxon(iconicTaxonName?: string): string {
    if (!iconicTaxonName) return 'unknown';
    
    switch (iconicTaxonName.toLowerCase()) {
      case 'animalia':
        return 'animal';
      case 'plantae':
        return 'flower';
      case 'insecta':
      case 'arachnida':
      case 'mollusca':
        return 'bug';
      default:
        return 'unknown';
    }
  }

  /**
   * Remove duplicate taxa from results
   */
  private removeDuplicateTaxa(results: iNaturalistIdentification[]): iNaturalistIdentification[] {
    const seen = new Set<number>();
    return results.filter(result => {
      if (seen.has(result.taxon.id)) {
        return false;
      }
      seen.add(result.taxon.id);
      return true;
    });
  }

  /**
   * Legacy method - now uses label-based identification
   */
  async identifySpecies(imageBuffer: Buffer): Promise<iNaturalistIdentification[]> {
    try {
      // This method is now deprecated in favor of identifySpeciesFromLabels
      console.log('iNaturalist direct image identification not implemented - use identifySpeciesFromLabels');
      return [];
    } catch (error) {
      console.error('iNaturalist identification error:', error);
      return [];
    }
  }

  /**
   * Search for observations by location and taxon
   */
  async searchObservations(params: {
    lat?: number;
    lng?: number;
    radius?: number;
    taxon_id?: number;
    iconic_taxon_name?: string;
    quality_grade?: string;
    per_page?: number;
  }): Promise<iNaturalistObservation[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.lat && params.lng) {
        queryParams.append('lat', params.lat.toString());
        queryParams.append('lng', params.lng.toString());
      }
      
      if (params.radius) {
        queryParams.append('radius', params.radius.toString());
      }
      
      if (params.taxon_id) {
        queryParams.append('taxon_id', params.taxon_id.toString());
      }
      
      if (params.iconic_taxon_name) {
        queryParams.append('iconic_taxon_name', params.iconic_taxon_name);
      }
      
      if (params.quality_grade) {
        queryParams.append('quality_grade', params.quality_grade);
      }
      
      queryParams.append('per_page', (params.per_page || 20).toString());
      queryParams.append('order', 'desc');
      queryParams.append('order_by', 'created_at');

      const response = await axios.get(
        `${this.baseURL}/observations?${queryParams.toString()}`,
        {
          headers: {
            'User-Agent': this.userAgent
          },
          timeout: 15000
        }
      );

      return response.data.results || [];
    } catch (error) {
      console.error('iNaturalist search error:', error);
      return [];
    }
  }

  /**
   * Get taxon information by ID
   */
  async getTaxon(taxonId: number): Promise<iNaturalistTaxon | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/taxa/${taxonId}`,
        {
          headers: {
            'User-Agent': this.userAgent
          },
          timeout: 10000
        }
      );

      return response.data.results?.[0] || null;
    } catch (error) {
      console.error('iNaturalist taxon error:', error);
      return null;
    }
  }

  /**
   * Search for taxa by name
   */
  async searchTaxa(query: string, params: {
    rank?: string;
    iconic_taxon_name?: string;
    per_page?: number;
  } = {}): Promise<iNaturalistTaxon[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      if (params.rank) {
        queryParams.append('rank', params.rank);
      }
      
      if (params.iconic_taxon_name) {
        queryParams.append('iconic_taxon_name', params.iconic_taxon_name);
      }
      
      queryParams.append('per_page', (params.per_page || 20).toString());

      const response = await axios.get(
        `${this.baseURL}/taxa?${queryParams.toString()}`,
        {
          headers: {
            'User-Agent': this.userAgent
          },
          timeout: 10000
        }
      );

      return response.data.results || [];
    } catch (error) {
      console.error('iNaturalist taxa search error:', error);
      return [];
    }
  }

  /**
   * Get nearby observations for a location
   */
  async getNearbyObservations(lat: number, lng: number, radius: number = 5): Promise<iNaturalistObservation[]> {
    return this.searchObservations({
      lat,
      lng,
      radius,
      quality_grade: 'research',
      per_page: 50
    });
  }

  /**
   * Get observations by iconic taxon (Animalia, Plantae, etc.)
   */
  async getObservationsByIconicTaxon(iconicTaxonName: string, lat?: number, lng?: number): Promise<iNaturalistObservation[]> {
    return this.searchObservations({
      iconic_taxon_name: iconicTaxonName,
      lat,
      lng,
      radius: 10,
      quality_grade: 'research',
      per_page: 30
    });
  }

  /**
   * Convert iNaturalist result to our app's format
   */
  convertToAppFormat(iNaturalistResult: iNaturalistIdentification): {
    commonName: string;
    scientificName: string;
    category: string;
    confidence: number;
    source: string;
    details?: any;
  } {
    const taxon = iNaturalistResult.taxon;
    
    // Determine category based on iconic taxon
    let category = 'unknown';
    switch (taxon.iconic_taxon_name?.toLowerCase()) {
      case 'animalia':
        category = 'animal';
        break;
      case 'plantae':
        category = 'flower';
        break;
      case 'insecta':
      case 'arachnida':
      case 'mollusca':
        category = 'bug';
        break;
    }

    return {
      commonName: taxon.preferred_common_name || taxon.name,
      scientificName: taxon.name,
      category,
      confidence: iNaturalistResult.score || 0,
      source: 'iNaturalist',
      details: {
        taxonId: taxon.id,
        rank: taxon.rank,
        iconicTaxon: taxon.iconic_taxon_name,
        visionScore: iNaturalistResult.vision_score,
        frequencyScore: iNaturalistResult.frequency_score
      }
    };
  }

  /**
   * Get multiple identifications and return the best match
   */
  async getBestIdentification(imageBuffer: Buffer): Promise<{
    commonName: string;
    scientificName: string;
    category: string;
    confidence: number;
    source: string;
    details?: any;
  } | null> {
    try {
      const identifications = await this.identifySpecies(imageBuffer);
      
      if (identifications.length === 0) {
        return null;
      }

      // Sort by score (highest first)
      const sortedIdentifications = identifications.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Get the best match
      const bestMatch = sortedIdentifications[0];
      
      // Only return if confidence is reasonable
      if ((bestMatch.score || 0) < 0.3) {
        return null;
      }

      return this.convertToAppFormat(bestMatch);
    } catch (error) {
      console.error('iNaturalist best identification error:', error);
      return null;
    }
  }
}

// Export singleton instance
const iNaturalistAPIInstance = new iNaturalistAPI();
export { iNaturalistAPIInstance as iNaturalistAPI };
export default iNaturalistAPIInstance;
