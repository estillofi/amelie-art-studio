"""Read generated line art and trace enclosed paintable areas; original artwork is never changed."""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import contourpy
ROOT=Path(__file__).resolve().parents[1]
import argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('adventures',help='Original generated 1536x1024 PNG master')
parser.add_argument('familiar',help='Original generated 1254x1254 PNG master')
args=parser.parse_args()
SHEETS={
'adventures':(args.adventures,3,2),
'familiar':(args.familiar,2,2)}
# Component numbers are stable for these source images. Each small enclosed detail remains independently paintable.
MAPS=[
('adventures',0,'dino-garden',{'cloud':[3],'sun':[2,4,5,6,8,9,10,11,13,15,17],'tree':[14,32],'dinosaur':[7,12,16,18,22,24,28,30,33,37,38],'flower':[19,21,23,26,27,31,35,36],'grass':[29,34]}),
('adventures',1,'cat-dojo',{'star':[2,4,5,8,16,17],'cat':[7,9,11,14,15,18,19,20,22,23,25,26,30,33,35,55,56],'kimono':[27,28,29,34,37,42,45],'belt':[32,38,39,40,43,44,51],'ball':[47,48,50,54],'mat':[52]}),
('adventures',2,'art-studio',{'sun':[2,3,4,5,6,7,8,9,11,13,15],'palette':[10,12,14,19,23],'brush':[18,20,21,22],'pencil':[32,35,38,40,43,46,48],'book':[24,25,26,27,28,30,33,34,42,44,45,47,56]}),
('adventures',3,'paper-boat',{'cloud':[3],'sun':[2,6,7,8,11,12,13,14,15,16,17],'sail':[9,10],'boat':[4,5,18,20,21,23,24],'fish':[25,26,27,28,29,30],'water':[19,31,33]}),
('adventures',4,'bunny-picnic',{'rabbit':[2,3,5,14,15,16,32,42,44,45],'butterfly':[4,6,7,8,9,10,11,12],'carrot':[17,23],'strawberry':[18,20,31,33,35,36],'cup':[39,43,46,48,55],'grass':[19,29,30,34,37,61],'blanket':[40,41,49,50,51,52,53,54,56,57,58,59,60,62]}),
('adventures',5,'space-friends',{'moon':[2,9],'star':[3,4,5,7,10,14,15,17,22,30,33,35,36,37,39],'planet':[19,20,23,24,26,27,28,29,32,34],'flame':[21,25],'rocket':[6,8,13,16,18],'window':[11,12]}),
('familiar',0,'house',{'sun':[2,3,4,5,7,8,10,11,12,13,15,16],'cloud':[6],'roof':[14],'tree':[18,40],'house':[17,21],'window':[23,24,25,26,32,33,34,35],'door':[27,38],'flower':[22,28,29,36,39,42],'grass':[20,37,41]}),
('familiar',1,'pets',{'bird':[2,5,7],'fish':[3,4,6,8,9,10,11,12,15],'cat':[17,21,22,23,24,28,30,31,32,37,38,40,41,42,43,44,47,48,50],'heart':[25,26,27,29],'ball':[33,34,35,36,45],'grass':[46]}),
('familiar',2,'night',{'moon':[3,11,13],'star':[2,4,5,6,7,8,9,10,12,15,16],'cloud':[17],'tree':[18,39,41],'roof':[20],'house':[19,23],'heart':[24,25,26,38],'window':[27,28,29,30,32,33,34,35],'door':[36]})]
def letters(n):
 s=''
 while n>=0:s=chr(97+n%26)+s;n=n//26-1
 return s
def simplify(p,eps=.5):
 if len(p)<3:return p
 a=p[0];b=p[-1];v=b-a;norm=np.linalg.norm(v)
 ds=np.linalg.norm(p-a,axis=1) if norm==0 else np.abs(v[0]*(a[1]-p[:,1])-(a[0]-p[:,0])*v[1])/norm
 k=int(ds.argmax())
 if ds[k]<=eps:return np.array([a,b])
 return np.concatenate([simplify(p[:k+1],eps)[:-1],simplify(p[k:],eps)])
def path_for(mask):
 padded=np.pad(ndi.binary_dilation(mask,iterations=2),1).astype(float)
 lines=contourpy.contour_generator(z=padded).lines(.5);paths=[]
 for line in lines:
  p=simplify(line-1);paths.append('M'+' '.join(f'{x:.1f},{y:.1f}' for x,y in p)+'Z')
 return ''.join(paths)
result={}
for sheet,idx,name,groups in MAPS:
 src,cols,rows=SHEETS[sheet];a=np.array(Image.open(src).convert('RGB'));H,W=a.shape[:2];ox=round(idx%cols*W/cols);oy=round(idx//cols*H/rows);w=round((idx%cols+1)*W/cols)-ox;h=round((idx//cols+1)*H/rows)-oy
 basecell=a[oy:oy+h,ox:ox+w];baseox=ox
 baseink=(basecell[:,:,0]<190)&(basecell[:,:,2]>basecell[:,:,0]*1.1);baselab,_=ndi.label(~ndi.binary_dilation(baseink,iterations=1))
 oldgroups=groups
 if sheet=='adventures':
  bounds={0:(0,536),1:(540,1024),2:(1024,1536),3:(0,512),4:(524,1024),5:(1036,1536)}
  ox,end=bounds[idx];w=end-ox
 cell=a[oy:oy+h,ox:ox+w];ink=(cell[:,:,0]<190)&(cell[:,:,2]>cell[:,:,0]*1.1);barrier=ndi.binary_dilation(ink,iterations=1);lab,n=ndi.label(~barrier)
 outside=set(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]));parts={j:lab==j for j in range(1,n+1) if j not in outside and (lab==j).sum()>=28}
 if sheet=='adventures':
  wordbyid={j:word for word,ids in oldgroups.items() for j in ids};groups={word:[] for word in oldgroups}
  centers={j:np.array(ndi.center_of_mass(baselab==j))+np.array([oy,baseox]) for j in wordbyid}
  for j,mask in parts.items():
   ys,xs=np.where(mask);absolute_x=xs+ox;valid=(absolute_x>=baseox)&(absolute_x<baseox+basecell.shape[1]);ids=baselab[ys[valid],absolute_x[valid]-baseox];counts={k:int((ids==k).sum()) for k in wordbyid}
   best=max(counts,key=counts.get)
   if counts[best]==0:
    center=np.array([ys.mean()+oy,absolute_x.mean()]);best=min(centers,key=lambda k:np.linalg.norm(centers[k]-center))
   groups[wordbyid[best]].append(j)
 assigned=[j for ids in groups.values() for j in ids];assert set(assigned)==set(parts),(name,'unmapped',set(parts)-set(assigned),'missing',set(assigned)-set(parts));assert len(assigned)==len(set(assigned))
 # Water lines are deliberately open. A closed wash lies beneath the hull and fish.
 if name=='paper-boat':groups={'water':groups['water'],**{word:ids for word,ids in groups.items() if word!='water'}}
 svg=''
 for word,ids in groups.items():
  shapes=''
  if name=='paper-boat' and word=='water':
   shapes='<path data-part="waterwash" d="M15 350Q43 324 70 341T130 342T190 342T250 342T310 342T370 342T430 342T501 340L501 467Q470 482 444 473T381 477T318 475T255 477T192 473T129 479T66 472T15 467Z"/>'
  shapes+=''.join(f'<path data-part="piece{letters(j)}" fill-rule="evenodd" d="{path_for(parts[j])}"/>' for j in ids)
  svg+=f'<g class="rg" data-w="{word}">{shapes}</g>'
 result[name]={'sheet':sheet,'width':w,'height':h,'sheetWidth':W,'sheetHeight':H,'x':ox,'y':oy,'svg':svg,'parts':len(parts)}
 print(name,len(parts),'parts',len(svg),'bytes')
(ROOT/'js/colouring/ink-regions.js').write_text('// Traced from generated colouring masters. See docs/colouring-pack.md. Do not edit artwork geometry by hand.\nexport const INK_ART = '+json.dumps(result,separators=(',',':'))+';\n')
